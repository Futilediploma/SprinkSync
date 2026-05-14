"""Notification queue helpers for superintendent manpower emails."""
from datetime import datetime, timedelta
from html import escape
from typing import Iterable, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

import models
from config import settings
from services.email_service import EmailProvider, get_email_provider


def write_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    actor_user_id: Optional[int] = None,
    message: Optional[str] = None,
) -> None:
    db.add(
        models.AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
        )
    )


class NotificationService:
    """Small DB-backed notification queue for internal manpower request emails."""

    @staticmethod
    def enqueue_manpower_notifications(
        db: Session,
        manpower_request: models.ManpowerRequest,
        notification_type: str,
        actor_user_id: Optional[int] = None,
        recipient_emails: Optional[Iterable[str]] = None,
    ) -> list[models.Notification]:
        project = manpower_request.project
        if not project:
            project = db.query(models.Project).filter(models.Project.id == manpower_request.project_id).first()

        recipients = (
            NotificationService._normalize_recipient_emails(recipient_emails)
            if recipient_emails is not None
            else NotificationService._resolve_recipients(project, manpower_request)
        )
        notifications: list[models.Notification] = []
        for email in recipients:
            notification = models.Notification(
                manpower_request_id=manpower_request.id,
                recipient_email=email,
                notification_type=notification_type,
                provider="postmark",
                status="queued",
                attempt_count=0,
                next_attempt_at=datetime.utcnow(),
            )
            db.add(notification)
            notifications.append(notification)

        write_audit_log(
            db,
            action="notification.queued",
            entity_type="manpower_request",
            entity_id=manpower_request.id,
            actor_user_id=actor_user_id,
            message=f"Queued {len(notifications)} notification(s)",
        )
        return notifications

    @staticmethod
    def process_due_notifications(
        db: Session,
        provider: Optional[EmailProvider] = None,
        limit: int = 25,
    ) -> int:
        now = datetime.utcnow()
        due_notifications = (
            db.query(models.Notification)
            .options(
                joinedload(models.Notification.manpower_request).joinedload(models.ManpowerRequest.project)
            )
            .filter(
                models.Notification.status.in_(["queued", "failed"]),
                models.Notification.attempt_count < settings.notification_max_attempts,
                or_(
                    models.Notification.next_attempt_at.is_(None),
                    models.Notification.next_attempt_at <= now,
                ),
            )
            .order_by(models.Notification.created_at.asc())
            .limit(limit)
            .all()
        )

        email_provider = provider or get_email_provider()
        for notification in due_notifications:
            NotificationService.send_notification(db, notification, email_provider)
        return len(due_notifications)

    @staticmethod
    def send_notification(
        db: Session,
        notification: models.Notification,
        provider: Optional[EmailProvider] = None,
    ) -> None:
        manpower_request = notification.manpower_request
        project = manpower_request.project if manpower_request else None
        if not manpower_request or not project:
            notification.status = "failed"
            notification.error_message = "Notification is missing manpower request or project"
            notification.attempt_count += 1
            notification.next_attempt_at = None
            db.commit()
            return

        subject, html_body, text_body = build_manpower_email(
            notification.notification_type,
            project,
            manpower_request,
        )

        try:
            email_provider = provider or get_email_provider()
            result = email_provider.send_email(
                to_email=notification.recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
            )
            notification.status = "sent"
            notification.provider_message_id = result.provider_message_id
            notification.sent_at = datetime.utcnow()
            notification.error_message = None
            notification.attempt_count += 1
            notification.next_attempt_at = None
            write_audit_log(
                db,
                action="notification.sent",
                entity_type="notification",
                entity_id=notification.id,
                message=f"Sent manpower notification to {notification.recipient_email}",
            )
        except Exception as exc:
            notification.status = "failed"
            notification.error_message = str(exc)
            notification.attempt_count += 1
            if notification.attempt_count < settings.notification_max_attempts:
                notification.next_attempt_at = datetime.utcnow() + timedelta(minutes=notification.attempt_count * 5)
            else:
                notification.next_attempt_at = None
            write_audit_log(
                db,
                action="notification.failed",
                entity_type="notification",
                entity_id=notification.id,
                message=f"Failed manpower notification to {notification.recipient_email}: {exc}",
            )
        db.commit()

    @staticmethod
    def _resolve_recipients(
        project: Optional[models.Project],
        manpower_request: models.ManpowerRequest,
    ) -> list[str]:
        employees: Iterable[Optional[models.Employee]] = (
            project.superintendent if project else None,
            project.pm if project else None,
            manpower_request.foreman,
        )
        return NotificationService._normalize_recipient_emails(
            employee.email for employee in employees if employee and employee.active and employee.email
        )

    @staticmethod
    def _normalize_recipient_emails(recipient_emails: Iterable[str]) -> list[str]:
        recipients: list[str] = []
        for email in recipient_emails:
            normalized = email.strip().lower()
            if normalized and normalized not in recipients:
                recipients.append(normalized)
        return recipients


def build_manpower_email(
    notification_type: str,
    project: models.Project,
    manpower_request: models.ManpowerRequest,
) -> tuple[str, str, str]:
    verb = "Updated" if notification_type == "manpower_request_updated" else "New"
    project_name = project.name or "Unnamed Project"
    subject = f"{verb} Manpower Request - {project_name}"

    fields = [
        ("Project", project_name),
        ("GC", project.customer_name or ""),
        ("Address", project.address or ""),
        ("Requested Manpower", manpower_request.manpower_required),
        ("Trades", manpower_request.requested_trades),
        ("Start Date", manpower_request.start_datetime.strftime("%b %d, %Y")),
        ("Duration", manpower_request.expected_duration),
        ("Notes", manpower_request.notes or ""),
    ]

    html_rows = "\n".join(
        f"<tr><th>{escape(label)}</th><td>{escape(str(value))}</td></tr>" for label, value in fields
    )
    html_body = f"""<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
      <h1 style="font-size:20px;line-height:28px;margin:0 0 16px;">BFPE Manpower Notification</h1>
      <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:20px;">
        <style>
          th {{ text-align:left; width:180px; padding:8px; border-top:1px solid #e5e7eb; color:#374151; }}
          td {{ padding:8px; border-top:1px solid #e5e7eb; color:#111827; }}
        </style>
        {html_rows}
      </table>
    </div>
  </div>
</body>
</html>"""

    text_body = "\n".join(f"{label}: {value}" for label, value in fields)
    return subject, html_body, text_body
