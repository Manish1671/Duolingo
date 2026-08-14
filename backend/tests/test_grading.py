import unittest
from datetime import date
from types import SimpleNamespace

from app.services.grading import grade_exercise, grade_match_pair
from app.services.gamification import apply_streak_and_xp


class GradingTests(unittest.TestCase):
    def test_multiple_choice(self):
        ok, expected = grade_exercise(
            "multiple_choice", {"optionId": "hola"}, {"optionId": "hola"}
        )
        self.assertTrue(ok)
        self.assertEqual(expected, "hola")

    def test_type_answer_accents(self):
        ok, _ = grade_exercise("type_answer", {"text": "menú"}, {"text": "menu"})
        self.assertTrue(ok)

    def test_translate_tap_order(self):
        ok, _ = grade_exercise(
            "translate_tap", {"tokenIds": [1, 2, 3]}, {"tokenIds": [1, 2, 3]}
        )
        self.assertTrue(ok)
        bad, _ = grade_exercise(
            "translate_tap", {"tokenIds": [1, 2, 3]}, {"tokenIds": [3, 2, 1]}
        )
        self.assertFalse(bad)

    def test_match_pair(self):
        correct = {"pairs": [["l0", "r0"], ["l1", "r1"]]}
        self.assertTrue(grade_match_pair(correct, "l0", "r0"))
        self.assertFalse(grade_match_pair(correct, "l0", "r1"))


class StreakTests(unittest.TestCase):
    def _stats(self, last: date | None, streak: int):
        return SimpleNamespace(
            xp=0,
            gems=0,
            hearts=5,
            streak=streak,
            last_active_date=last,
            daily_goal_xp=20,
            xp_today=0,
            xp_today_date=last,
        )

    def test_increments_next_day(self):
        stats = self._stats(date(2026, 8, 12), 4)
        apply_streak_and_xp(stats, 10, today=date(2026, 8, 13))
        self.assertEqual(stats.streak, 5)

    def test_resets_after_gap(self):
        stats = self._stats(date(2026, 8, 10), 4)
        apply_streak_and_xp(stats, 10, today=date(2026, 8, 13))
        self.assertEqual(stats.streak, 1)

    def test_same_day_no_double(self):
        stats = self._stats(date(2026, 8, 13), 4)
        apply_streak_and_xp(stats, 10, today=date(2026, 8, 13))
        self.assertEqual(stats.streak, 4)
        self.assertEqual(stats.xp, 10)


if __name__ == "__main__":
    unittest.main()
