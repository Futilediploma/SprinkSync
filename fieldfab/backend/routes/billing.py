from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import stripe

from auth import get_current_user
from database import get_db
from models import User
from schemas import BillingSessionResponse

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

router = APIRouter(tags=["Billing"])

PRO_STATUSES = {"active", "trialing"}


def require_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Billing is not configured: {name} is missing.",
        )
    return value


def stripe_id(value) -> str | None:
    if not value:
        return None
    if isinstance(value, str):
        return value
    return getattr(value, "id", None)


def timestamp_to_datetime(value) -> datetime | None:
    if not value:
        return None
    return datetime.fromtimestamp(int(value), tz=timezone.utc)


def apply_subscription(user: User, subscription) -> None:
    subscription_status = subscription.get("status")
    user.stripe_subscription_id = subscription.get("id")
    user.stripe_subscription_status = subscription_status
    user.stripe_current_period_end = timestamp_to_datetime(
        subscription.get("current_period_end")
    )
    user.plan_type = "pro" if subscription_status in PRO_STATUSES else "free"


@router.post("/billing/checkout-session", response_model=BillingSessionResponse)
def create_checkout_session(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    stripe.api_key = require_setting("STRIPE_SECRET_KEY")
    price_id = require_setting("STRIPE_PRO_PRICE_ID")
    frontend_url = require_setting("FRONTEND_APP_URL").rstrip("/")

    if current_user.plan_type == "pro":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account already has Pro access. Use Manage Billing instead.",
        )

    customer_id = current_user.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.company_name or None,
            metadata={"fieldfab_user_id": str(current_user.id)},
        )
        customer_id = customer.id
        current_user.stripe_customer_id = customer_id
        db.commit()

    checkout_session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{frontend_url}?billing=success",
        cancel_url=f"{frontend_url}?billing=cancelled",
        client_reference_id=str(current_user.id),
        metadata={"fieldfab_user_id": str(current_user.id)},
        subscription_data={"metadata": {"fieldfab_user_id": str(current_user.id)}},
        allow_promotion_codes=True,
    )
    return BillingSessionResponse(url=checkout_session.url)


@router.post("/billing/portal-session", response_model=BillingSessionResponse)
def create_portal_session(
    current_user: Annotated[User, Depends(get_current_user)],
):
    stripe.api_key = require_setting("STRIPE_SECRET_KEY")
    frontend_url = require_setting("FRONTEND_APP_URL").rstrip("/")

    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No Stripe billing account exists for this user.",
        )

    portal_session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=frontend_url,
    )
    return BillingSessionResponse(url=portal_session.url)


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    stripe.api_key = require_setting("STRIPE_SECRET_KEY")
    webhook_secret = require_setting("STRIPE_WEBHOOK_SECRET")
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature.",
        )

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook.",
        )

    event_type = event["type"]
    event_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = event_object.get("metadata", {}).get("fieldfab_user_id")
        user = db.get(User, int(user_id)) if user_id and user_id.isdigit() else None
        if user:
            user.stripe_customer_id = stripe_id(event_object.get("customer"))
            user.stripe_subscription_id = stripe_id(event_object.get("subscription"))
            db.commit()

    elif event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        customer_id = stripe_id(event_object.get("customer"))
        user = (
            db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if customer_id
            else None
        )
        if not user:
            user_id = event_object.get("metadata", {}).get("fieldfab_user_id")
            user = db.get(User, int(user_id)) if user_id and user_id.isdigit() else None
        if user:
            if customer_id:
                user.stripe_customer_id = customer_id
            apply_subscription(user, event_object)
            db.commit()

    return {"received": True}
