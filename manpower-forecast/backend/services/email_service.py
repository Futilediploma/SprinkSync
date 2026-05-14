"""Email provider abstraction for internal manpower notifications."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
import json
from typing import Optional
from urllib import request, error

from config import settings


POSTMARK_URL = "https://api.postmarkapp.com/email"


@dataclass
class EmailResult:
    """Provider-neutral send result."""

    provider_message_id: Optional[str] = None


class EmailProvider(ABC):
    """Minimal email provider interface so Postmark can be swapped later."""

    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_body: str, text_body: str) -> EmailResult:
        """Send one transactional email to one recipient."""


class PostmarkEmailProvider(EmailProvider):
    """Postmark implementation for internal transactional notifications."""

    def send_email(self, to_email: str, subject: str, html_body: str, text_body: str) -> EmailResult:
        if not settings.postmark_api_key:
            raise RuntimeError("POSTMARK_API_KEY is not configured")
        if not settings.email_from:
            raise RuntimeError("EMAIL_FROM is not configured")

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": settings.postmark_api_key,
        }
        payload = {
            "From": settings.email_from,
            "To": to_email,
            "Subject": subject,
            "HtmlBody": html_body,
            "TextBody": text_body,
            "MessageStream": "outbound",
        }

        encoded_payload = json.dumps(payload).encode("utf-8")
        postmark_request = request.Request(
            POSTMARK_URL,
            data=encoded_payload,
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(postmark_request, timeout=15) as response:
                data = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            try:
                data = json.loads(body)
                message = data.get("Message") or body
            except json.JSONDecodeError:
                message = body or str(exc)
            raise RuntimeError(message) from exc
        except error.URLError as exc:
            raise RuntimeError(str(exc.reason)) from exc

        if data.get("ErrorCode"):
            raise RuntimeError(data.get("Message") or "Postmark rejected the message")
        return EmailResult(provider_message_id=data.get("MessageID"))


def get_email_provider() -> EmailProvider:
    """Factory kept small for now; useful for tests and future provider swaps."""

    return PostmarkEmailProvider()
