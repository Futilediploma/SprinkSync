import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from routes.billing import apply_subscription, stripe_id


class BillingSubscriptionTests(unittest.TestCase):
    def test_active_subscription_grants_pro(self):
        user = SimpleNamespace(
            plan_type="free",
            stripe_subscription_id=None,
            stripe_subscription_status=None,
            stripe_current_period_end=None,
        )
        period_end = 1780272000

        apply_subscription(
            user,
            {
                "id": "sub_test",
                "status": "active",
                "current_period_end": period_end,
            },
        )

        self.assertEqual(user.plan_type, "pro")
        self.assertEqual(user.stripe_subscription_id, "sub_test")
        self.assertEqual(user.stripe_subscription_status, "active")
        self.assertEqual(
            user.stripe_current_period_end,
            datetime.fromtimestamp(period_end, tz=timezone.utc),
        )

    def test_cancelled_subscription_returns_user_to_free(self):
        user = SimpleNamespace(
            plan_type="pro",
            stripe_subscription_id="sub_test",
            stripe_subscription_status="active",
            stripe_current_period_end=None,
        )

        apply_subscription(
            user,
            {
                "id": "sub_test",
                "status": "canceled",
                "current_period_end": None,
            },
        )

        self.assertEqual(user.plan_type, "free")
        self.assertEqual(user.stripe_subscription_status, "canceled")

    def test_stripe_id_accepts_string_or_object(self):
        self.assertEqual(stripe_id("cus_test"), "cus_test")
        self.assertEqual(stripe_id(SimpleNamespace(id="cus_test")), "cus_test")
        self.assertIsNone(stripe_id(None))


if __name__ == "__main__":
    unittest.main()
