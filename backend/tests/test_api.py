"""API tests use a throwaway SQLite file. Import this module before app.main."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

_fd, _DB = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["DUOLINGO_DB"] = _DB

from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Lesson, UserNodeProgress, UserStats  # noqa: E402
from app.seed import seed  # noqa: E402


class ApiFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()
        cls.client = TestClient(app)
        cls.headers = {"X-User-Id": "1"}

    @classmethod
    def tearDownClass(cls):
        engine.dispose()
        for path in (_DB, f"{_DB}-wal", f"{_DB}-shm"):
            try:
                Path(path).unlink(missing_ok=True)
            except OSError:
                pass

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["ok"])

    def test_me_starts_with_five_hearts(self):
        res = self.client.get("/api/me", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["hearts"], 5)
        self.assertEqual(body["displayName"], "Manish")

    def test_lesson_payload_hides_answers(self):
        path = self.client.get("/api/path", headers=self.headers).json()
        active = next(n for u in path["units"] for n in u["nodes"] if n["status"] == "active")
        lesson_id = active["nextLessonId"]
        res = self.client.get(f"/api/lessons/{lesson_id}", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["exercises"])
        for ex in body["exercises"]:
            self.assertNotIn("correct_json", ex)
            self.assertNotIn("correct", ex)

    def test_locked_lesson_cannot_start(self):
        db = SessionLocal()
        try:
            locked = (
                db.query(UserNodeProgress)
                .filter_by(user_id=1, status="locked")
                .first()
            )
            lesson = db.query(Lesson).filter_by(path_node_id=locked.path_node_id).first()
            lesson_id = lesson.id
        finally:
            db.close()
        res = self.client.post(f"/api/lessons/{lesson_id}/start", headers=self.headers)
        self.assertEqual(res.status_code, 403)

    def test_wrong_answer_costs_a_heart(self):
        path = self.client.get("/api/path", headers=self.headers).json()
        active = next(n for u in path["units"] for n in u["nodes"] if n["status"] == "active")
        lesson_id = active["nextLessonId"]
        started = self.client.post(f"/api/lessons/{lesson_id}/start", headers=self.headers)
        self.assertEqual(started.status_code, 200)
        attempt_id = started.json()["attemptId"]
        lesson = self.client.get(f"/api/lessons/{lesson_id}", headers=self.headers).json()
        first = lesson["exercises"][0]
        checked = self.client.post(
            f"/api/attempts/{attempt_id}/check",
            headers=self.headers,
            json={"exerciseId": first["id"], "answer": {"optionId": "__wrong__"}},
        )
        self.assertEqual(checked.status_code, 200)
        body = checked.json()
        self.assertFalse(body["correct"])
        self.assertEqual(body["hearts"], 4)

    def test_out_of_hearts_blocks_start(self):
        db = SessionLocal()
        try:
            stats = db.get(UserStats, 1)
            stats.hearts = 0
            db.commit()
        finally:
            db.close()
        try:
            path = self.client.get("/api/path", headers=self.headers).json()
            active = next(n for u in path["units"] for n in u["nodes"] if n["status"] == "active")
            res = self.client.post(
                f"/api/lessons/{active['nextLessonId']}/start",
                headers=self.headers,
            )
            self.assertEqual(res.status_code, 403)
        finally:
            db = SessionLocal()
            try:
                stats = db.get(UserStats, 1)
                stats.hearts = 5
                db.commit()
            finally:
                db.close()


if __name__ == "__main__":
    unittest.main()
