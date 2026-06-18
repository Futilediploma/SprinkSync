import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from access import (
    TRIAL_DAYS,
    get_access_state,
    get_access_summary,
    pre_trial_edit_allowed,
)


class AccessStateTests(unittest.TestCase):
    def test_new_free_user_is_pre_trial(self):
        user = SimpleNamespace(plan_type="free", trial_started_at=None)
        self.assertEqual(get_access_state(user), "pre_trial")

    def test_pro_user_bypasses_trial(self):
        user = SimpleNamespace(plan_type="pro", trial_started_at=None)
        self.assertEqual(get_access_state(user), "pro")

    def test_trial_is_active_before_exact_expiration(self):
        started_at = datetime(2026, 6, 1, tzinfo=timezone.utc)
        user = SimpleNamespace(plan_type="free", trial_started_at=started_at)
        now = started_at + timedelta(days=TRIAL_DAYS) - timedelta(seconds=1)
        self.assertEqual(get_access_state(user, now), "trial_active")

    def test_trial_expires_at_exact_boundary(self):
        started_at = datetime(2026, 6, 1, tzinfo=timezone.utc)
        user = SimpleNamespace(plan_type="free", trial_started_at=started_at)
        now = started_at + timedelta(days=TRIAL_DAYS)
        self.assertEqual(get_access_state(user, now), "trial_expired")
        self.assertFalse(get_access_summary(user, now)["can_mutate"])
        self.assertFalse(get_access_summary(user, now)["can_export"])

    def test_active_trial_rounds_remaining_days_up(self):
        started_at = datetime(2026, 6, 1, tzinfo=timezone.utc)
        user = SimpleNamespace(plan_type="free", trial_started_at=started_at)
        now = started_at + timedelta(days=14, hours=23)
        self.assertEqual(get_access_summary(user, now)["trial_days_remaining"], 1)


class PreTrialQuotaTests(unittest.TestCase):
    def test_account_under_limit_can_edit_up_to_ten(self):
        self.assertTrue(pre_trial_edit_allowed(current_total=7, existing_qty=2, requested_qty=5))
        self.assertFalse(pre_trial_edit_allowed(current_total=7, existing_qty=2, requested_qty=6))

    def test_legacy_over_limit_user_can_make_non_increasing_edit(self):
        self.assertTrue(pre_trial_edit_allowed(current_total=24, existing_qty=5, requested_qty=5))
        self.assertTrue(pre_trial_edit_allowed(current_total=24, existing_qty=5, requested_qty=3))
        self.assertFalse(pre_trial_edit_allowed(current_total=24, existing_qty=5, requested_qty=6))


if __name__ == "__main__":
    unittest.main()
