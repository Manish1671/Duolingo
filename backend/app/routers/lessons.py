from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_user_id
from ..models import (
    AttemptAnswer,
    Exercise,
    Lesson,
    LessonAttempt,
    PathNode,
    UserNodeProgress,
    UserSkillProgress,
    UserStats,
)
from ..schemas import CheckAnswerIn
from ..services.gamification import (
    apply_heart_regen,
    apply_streak_and_xp,
    lose_heart,
    parse_sim_date,
    refill_hearts,
    unlock_achievements,
)
from ..services.grading import grade_exercise, grade_match_pair

router = APIRouter()


def _public_exercise(ex: Exercise) -> dict:
    return {
        "id": ex.id,
        "position": ex.position,
        "type": ex.type,
        "prompt": ex.prompt,
        "payload": ex.payload_json,
    }


def _get_attempt(db: Session, attempt_id: int, user_id: int) -> LessonAttempt:
    attempt = (
        db.query(LessonAttempt)
        .options(joinedload(LessonAttempt.answers))
        .filter_by(id=attempt_id, user_id=user_id)
        .first()
    )
    if not attempt:
        raise HTTPException(404, "Attempt not found")
    return attempt


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    lesson = (
        db.query(Lesson)
        .options(joinedload(Lesson.exercises), joinedload(Lesson.path_node))
        .filter_by(id=lesson_id)
        .first()
    )
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    node_progress = (
        db.query(UserNodeProgress)
        .filter_by(user_id=user_id, path_node_id=lesson.path_node_id)
        .first()
    )
    if node_progress and node_progress.status == "locked":
        raise HTTPException(403, "This lesson is locked")
    exercises = sorted(lesson.exercises, key=lambda e: e.position)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "xpReward": lesson.xp_reward,
        "pathNodeId": lesson.path_node_id,
        "exercises": [_public_exercise(ex) for ex in exercises],
    }


@router.post("/lessons/{lesson_id}/start")
def start_lesson(lesson_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    stats = db.get(UserStats, user_id)
    if not stats:
        raise HTTPException(404, "User not found")
    apply_heart_regen(stats)

    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    node = db.get(PathNode, lesson.path_node_id)
    progress = (
        db.query(UserNodeProgress)
        .filter_by(user_id=user_id, path_node_id=lesson.path_node_id)
        .first()
    )
    is_practice = bool(node and node.node_type == "practice")
    if progress and progress.status == "locked":
        raise HTTPException(403, "This lesson is locked")
    if stats.hearts <= 0 and not is_practice:
        raise HTTPException(403, "Out of hearts")

    attempt = LessonAttempt(
        user_id=user_id,
        lesson_id=lesson_id,
        is_practice=is_practice,
        result="in_progress",
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"attemptId": attempt.id, "hearts": stats.hearts, "isPractice": is_practice}


@router.post("/attempts/{attempt_id}/check")
def check_answer(
    attempt_id: int,
    body: CheckAnswerIn,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
):
    attempt = _get_attempt(db, attempt_id, user_id)
    if attempt.result != "in_progress":
        raise HTTPException(400, "Attempt already finished")

    stats = db.get(UserStats, user_id)
    apply_heart_regen(stats)

    exercise = db.get(Exercise, body.exerciseId)
    if not exercise or exercise.lesson_id != attempt.lesson_id:
        raise HTTPException(400, "Exercise does not belong to this lesson")

    if exercise.type == "match_pairs" and body.leftId and body.rightId:
        correct = grade_match_pair(exercise.correct_json, body.leftId, body.rightId)
        expected = exercise.correct_json.get("pairs")
        if not correct:
            lose_heart(stats)
            attempt.hearts_lost += 1
            db.add(AttemptAnswer(attempt_id=attempt.id, exercise_id=exercise.id, is_correct=False))
            if stats.hearts <= 0 and not attempt.is_practice:
                attempt.result = "failed"
                attempt.finished_at = datetime.utcnow()
            db.commit()
            return {
                "correct": False,
                "expected": expected,
                "hearts": stats.hearts,
                "failed": attempt.result == "failed",
                "pairCorrect": False,
            }
        db.commit()
        return {
            "correct": True,
            "expected": expected,
            "hearts": stats.hearts,
            "failed": False,
            "pairCorrect": True,
        }

    is_correct, expected = grade_exercise(exercise.type, exercise.correct_json, body.answer)
    db.add(AttemptAnswer(attempt_id=attempt.id, exercise_id=exercise.id, is_correct=is_correct))
    if not is_correct:
        lose_heart(stats)
        attempt.hearts_lost += 1
        if stats.hearts <= 0 and not attempt.is_practice:
            attempt.result = "failed"
            attempt.finished_at = datetime.utcnow()
    db.commit()
    return {
        "correct": is_correct,
        "expected": expected,
        "hearts": stats.hearts,
        "failed": attempt.result == "failed",
    }


@router.post("/attempts/{attempt_id}/complete")
def complete_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
    simulateDate: str | None = Query(default=None),
):
    attempt = _get_attempt(db, attempt_id, user_id)
    stats = db.get(UserStats, user_id)
    lesson = db.get(Lesson, attempt.lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    if attempt.result == "completed":
        return {
            "alreadyCompleted": True,
            "xpAwarded": attempt.xp_awarded,
            "streak": stats.streak,
            "xp": stats.xp,
            "hearts": stats.hearts,
            "gems": stats.gems,
        }
    if attempt.result == "failed":
        raise HTTPException(400, "Attempt failed")

    required_ids = {ex.id for ex in db.query(Exercise).filter_by(lesson_id=lesson.id)}
    correct_ids = {
        row.exercise_id
        for row in db.query(AttemptAnswer).filter_by(attempt_id=attempt.id, is_correct=True)
    }
    if not required_ids.issubset(correct_ids):
        raise HTTPException(400, "Not all exercises completed correctly")

    xp = 5 if attempt.is_practice else lesson.xp_reward
    today = parse_sim_date(simulateDate) if simulateDate else None
    summary = apply_streak_and_xp(stats, xp, today=today)
    if not attempt.is_practice:
        stats.gems += 1
    attempt.result = "completed"
    attempt.finished_at = datetime.utcnow()
    attempt.xp_awarded = xp

    if not attempt.is_practice:
        _advance_progress(db, user_id, lesson)
    else:
        refill_hearts(stats)

    unlocked = unlock_achievements(db, user_id, stats)
    db.commit()
    return {
        "alreadyCompleted": False,
        "xpAwarded": xp,
        "streak": stats.streak,
        "streakIncremented": summary["streak_incremented"],
        "xpToday": summary["xp_today"],
        "dailyGoalXp": summary["daily_goal_xp"],
        "dailyGoalMet": summary["daily_goal_met"],
        "xp": stats.xp,
        "hearts": stats.hearts,
        "gems": stats.gems,
        "unlockedAchievements": unlocked,
    }


def _advance_progress(db: Session, user_id: int, lesson: Lesson) -> None:
    node = db.get(PathNode, lesson.path_node_id)
    if not node:
        return
    skill_row = (
        db.query(UserSkillProgress)
        .filter_by(user_id=user_id, skill_id=node.skill_id)
        .first()
    )
    if not skill_row:
        skill_row = UserSkillProgress(user_id=user_id, skill_id=node.skill_id)
        db.add(skill_row)
        db.flush()

    # Only increment if this lesson position is the next unfinished one
    if lesson.position > skill_row.lessons_completed:
        skill_row.lessons_completed = lesson.position

    from ..models import Skill as SkillModel

    skill = db.get(SkillModel, node.skill_id)
    total = skill.lessons_total if skill else 1
    if skill_row.lessons_completed >= total:
        skill_row.crown_level = max(skill_row.crown_level, 1)
        skill_row.completed_at = datetime.utcnow()
        node_row = (
            db.query(UserNodeProgress)
            .filter_by(user_id=user_id, path_node_id=node.id)
            .first()
        )
        if node_row:
            node_row.status = "complete"
        nxt = (
            db.query(PathNode)
            .filter(PathNode.position == node.position + 1)
            .first()
        )
        if nxt:
            nxt_row = (
                db.query(UserNodeProgress)
                .filter_by(user_id=user_id, path_node_id=nxt.id)
                .first()
            )
            if nxt_row and nxt_row.status == "locked":
                nxt_row.status = "active"
            elif not nxt_row:
                db.add(UserNodeProgress(user_id=user_id, path_node_id=nxt.id, status="active"))


@router.post("/practice/refill")
def practice_refill(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    """Return a short practice lesson id (first practice node) to refill hearts."""
    stats = db.get(UserStats, user_id)
    if not stats:
        raise HTTPException(404, "User not found")
    node = db.query(PathNode).filter_by(node_type="practice").order_by(PathNode.position).first()
    if not node or not node.lessons:
        refill_hearts(stats)
        db.commit()
        return {"hearts": stats.hearts, "lessonId": None}
    lesson = sorted(node.lessons, key=lambda l: l.position)[0]
    return {"lessonId": lesson.id, "hearts": stats.hearts}
