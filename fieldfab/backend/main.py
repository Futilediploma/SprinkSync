from typing import Annotated
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import models
from auth import create_access_token, hash_password, verify_password
from database import Base, engine, get_db
from models import SalesLead, User
from access import get_access_summary
from routes import billing, exports, projects, pieces, loose_materials
from schemas import (
    LoginRequest,
    MarketingPreferencesUpdate,
    RegisterRequest,
    SalesLeadCreate,
    SalesLeadResponse,
    TokenResponse,
    UserResponse,
)
from auth import get_current_user

# Create all tables on startup
Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_emails_opt_in BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in_source VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_unsubscribed_at TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMP WITH TIME ZONE"))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_stripe_customer_id ON users (stripe_customer_id)"))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_stripe_subscription_id ON users (stripe_subscription_id)"))
    conn.execute(text("ALTER TABLE pieces ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1"))
    conn.execute(text("ALTER TABLE pieces ADD COLUMN IF NOT EXISTS threaded_fittings JSON NOT NULL DEFAULT '[]'"))

app = FastAPI(title="FieldFab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "capacitor://localhost",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(pieces.router)
app.include_router(loose_materials.router)
app.include_router(exports.router)
app.include_router(billing.router)


def user_response_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "company_name": user.company_name,
        "plan_type": user.plan_type,
        "marketing_emails_opt_in": user.marketing_emails_opt_in,
        "marketing_opt_in_at": user.marketing_opt_in_at,
        "marketing_opt_in_source": user.marketing_opt_in_source,
        "marketing_unsubscribed_at": user.marketing_unsubscribed_at,
        "created_at": user.created_at,
        **get_access_summary(user),
    }


# ── Auth endpoints ─────────────────────────────────────────────────────────────

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        company_name=body.company_name,
        marketing_emails_opt_in=body.marketing_emails_opt_in,
        marketing_opt_in_at=datetime.now(timezone.utc) if body.marketing_emails_opt_in else None,
        marketing_opt_in_source="signup" if body.marketing_emails_opt_in else None,
        marketing_unsubscribed_at=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_response_payload(user)


@app.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]):
    return user_response_payload(current_user)


@app.patch("/me/marketing-preferences", response_model=UserResponse)
def update_marketing_preferences(
    body: MarketingPreferencesUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    current_user.marketing_emails_opt_in = body.marketing_emails_opt_in
    if body.marketing_emails_opt_in:
        current_user.marketing_opt_in_at = datetime.now(timezone.utc)
        current_user.marketing_opt_in_source = "account"
        current_user.marketing_unsubscribed_at = None
    else:
        current_user.marketing_unsubscribed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(current_user)
    return user_response_payload(current_user)


@app.post("/sales-leads", response_model=SalesLeadResponse, status_code=status.HTTP_201_CREATED)
def create_sales_lead(body: SalesLeadCreate, db: Annotated[Session, Depends(get_db)]):
    lead = SalesLead(**body.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead
