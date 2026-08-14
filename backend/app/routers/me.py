from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_user_id
from ..models import Achievement, User, UserAchievement, UserStats
from ..schemas import GoalIn
from ..services.gamification import apply_heart_regen, next_heart_in_seconds, parse_sim_date

router = APIRouter()


def _stats_payload(user: User, stats: UserStats, today: date | None = None) -> dict:
    today = today or date.today()
    xp_today = stats.xp_today if stats.xp_today_date == today else 0
    return {
        "id": user.id,
        "displayName": user.display_name,
        "avatarColor": user.avatar_color,
        "xp": stats.xp,
        "gems": stats.gems,
        "hearts": stats.hearts,
        "streak": stats.streak,
        "lastActiveDate": stats.last_active_date.isoformat() if stats.last_active_date else None,
        "dailyGoalXp": stats.daily_goal_xp,
        "xpToday": xp_today,
        "heartsUpdatedAt": stats.hearts_updated_at.isoformat() if stats.hearts_updated_at else None,
        "nextHeartInSeconds": next_heart_in_seconds(stats),
    }


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
    simulateDate: str | None = Query(default=None),
):
    user = db.get(User, user_id)
    if not user or not user.stats:
        return {"error": "User not found"}
    apply_heart_regen(user.stats)
    today = parse_sim_date(simulateDate) if simulateDate else date.today()
    db.commit()
    db.refresh(user.stats)
    payload = _stats_payload(user, user.stats, today=today)
    payload["simulatedDate"] = today.isoformat()
    return payload


@router.patch("/me/goal")
def update_goal(
    body: GoalIn,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
):
    stats = db.get(UserStats, user_id)
    if not stats:
        return {"error": "User not found"}
    stats.daily_goal_xp = max(10, min(50, body.dailyGoalXp))
    db.commit()
    return {"dailyGoalXp": stats.daily_goal_xp}


@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
):
    user = db.get(User, user_id)
    if not user or not user.stats:
        return {"error": "User not found"}
    apply_heart_regen(user.stats)
    db.commit()
    unlocked = (
        db.query(UserAchievement, Achievement)
        .join(Achievement, Achievement.id == UserAchievement.achievement_id)
        .filter(UserAchievement.user_id == user_id)
        .all()
    )
    completed = sum(1 for p in user.skill_progress if p.crown_level > 0)
    return {
        "user": _stats_payload(user, user.stats),
        "skillsCompleted": completed,
        "league": "Emerald",
        "joined": user.created_at.isoformat() if user.created_at else None,
        "achievements": [
            {
                "code": ach.code,
                "title": ach.title,
                "description": ach.description,
                "unlockedAt": ua.unlocked_at.isoformat(),
            }
            for ua, ach in unlocked
        ],
    }


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    rows = (
        db.query(User, UserStats)
        .join(UserStats, UserStats.user_id == User.id)
        .order_by(UserStats.xp.desc())
        .all()
    )
    you_rank = next((i + 1 for i, (u, _) in enumerate(rows) if u.id == user_id), None)
    return {
        "league": "Emerald League",
        "yourRank": you_rank,
        "entries": [
            {
                "rank": i + 1,
                "userId": user.id,
                "displayName": user.display_name,
                "avatarColor": user.avatar_color,
                "xp": stats.xp,
                "isYou": user.id == user_id,
            }
            for i, (user, stats) in enumerate(rows)
        ]
    }
