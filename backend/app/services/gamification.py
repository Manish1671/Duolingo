from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from ..models import Achievement, UserAchievement, UserStats

HEART_REGEN_HOURS = 4
MAX_HEARTS = 5


def apply_heart_regen(stats: UserStats, now: datetime | None = None) -> UserStats:
    now = now or datetime.utcnow()
    if stats.hearts >= MAX_HEARTS:
        stats.hearts_updated_at = now
        return stats
    elapsed = now - (stats.hearts_updated_at or now)
    gained = int(elapsed.total_seconds() // (HEART_REGEN_HOURS * 3600))
    if gained <= 0:
        return stats
    stats.hearts = min(MAX_HEARTS, stats.hearts + gained)
    stats.hearts_updated_at = now if stats.hearts == MAX_HEARTS else (
        stats.hearts_updated_at + timedelta(hours=HEART_REGEN_HOURS * gained)
    )
    return stats


def next_heart_in_seconds(stats: UserStats, now: datetime | None = None) -> int | None:
    if stats.hearts >= MAX_HEARTS:
        return None
    now = now or datetime.utcnow()
    nxt = (stats.hearts_updated_at or now) + timedelta(hours=HEART_REGEN_HOURS)
    return max(0, int((nxt - now).total_seconds()))


def lose_heart(stats: UserStats, now: datetime | None = None) -> int:
    now = now or datetime.utcnow()
    if stats.hearts > 0:
        if stats.hearts == MAX_HEARTS:
            stats.hearts_updated_at = now
        stats.hearts -= 1
    return stats.hearts


def refill_hearts(stats: UserStats, now: datetime | None = None) -> UserStats:
    now = now or datetime.utcnow()
    stats.hearts = MAX_HEARTS
    stats.hearts_updated_at = now
    return stats


def parse_sim_date(raw: str | None) -> date:
    if raw:
        return date.fromisoformat(raw)
    return datetime.utcnow().date()


def apply_streak_and_xp(
    stats: UserStats,
    xp: int,
    today: date | None = None,
) -> dict:
    today = today or datetime.utcnow().date()
    previous_streak = stats.streak
    last = stats.last_active_date

    if last == today:
        pass
    elif last == today - timedelta(days=1):
        stats.streak = (stats.streak or 0) + 1
    elif last is None:
        stats.streak = 1
    else:
        stats.streak = 1

    stats.last_active_date = today
    stats.xp += xp

    if stats.xp_today_date != today:
        stats.xp_today = 0
        stats.xp_today_date = today
    stats.xp_today += xp

    return {
        "xp_awarded": xp,
        "streak": stats.streak,
        "streak_incremented": stats.streak != previous_streak and last != today,
        "xp_today": stats.xp_today,
        "daily_goal_xp": stats.daily_goal_xp,
        "daily_goal_met": stats.xp_today >= stats.daily_goal_xp,
    }


def unlock_achievements(db: Session, user_id: int, stats: UserStats) -> list[str]:
    owned = {
        row.achievement.code
        for row in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        if row.achievement
    }
    catalog = {row.code: row for row in db.query(Achievement).all()}
    newly: list[str] = []

    def grant(code: str) -> None:
        if code in owned or code not in catalog:
            return
        db.add(UserAchievement(user_id=user_id, achievement_id=catalog[code].id))
        owned.add(code)
        newly.append(code)

    if stats.xp >= 10:
        grant("first_lesson")
    if stats.streak >= 3:
        grant("streak_3")
    if stats.xp >= 100:
        grant("xp_100")
    if stats.hearts == 0:
        grant("out_of_hearts")
    return newly
