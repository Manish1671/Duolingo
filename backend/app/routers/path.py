from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_user_id
from ..models import Course, Lesson, PathNode, UserNodeProgress, UserSkillProgress, UserStats
from ..services.gamification import apply_heart_regen

router = APIRouter()


@router.get("/path")
def get_path(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    stats = db.get(UserStats, user_id)
    if stats:
        apply_heart_regen(stats)
        db.commit()

    course = db.query(Course).options(joinedload(Course.units)).first()
    if not course:
        return {"error": "No course seeded"}

    nodes = (
        db.query(PathNode)
        .options(joinedload(PathNode.skill), joinedload(PathNode.lessons))
        .order_by(PathNode.position)
        .all()
    )
    node_status = {
        row.path_node_id: row.status
        for row in db.query(UserNodeProgress).filter_by(user_id=user_id)
    }
    skill_prog = {
        row.skill_id: row
        for row in db.query(UserSkillProgress).filter_by(user_id=user_id)
    }

    units_out = []
    for unit in sorted(course.units, key=lambda u: u.position):
        unit_nodes = [n for n in nodes if n.unit_id == unit.id]
        packed = []
        for node in unit_nodes:
            progress = skill_prog.get(node.skill_id)
            lessons = sorted(node.lessons, key=lambda l: l.position)
            completed = progress.lessons_completed if progress else 0
            total = node.skill.lessons_total if node.skill else max(len(lessons), 1)
            status = node_status.get(node.id, "locked")
            next_lesson = None
            if status != "locked" and lessons:
                idx = min(completed, len(lessons) - 1)
                next_lesson = lessons[idx].id if status != "complete" else lessons[0].id
            packed.append(
                {
                    "id": node.id,
                    "position": node.position,
                    "type": node.node_type,
                    "title": node.skill.title if node.skill else "Lesson",
                    "color": unit.color,
                    "status": status,
                    "crownLevel": progress.crown_level if progress else 0,
                    "lessonsCompleted": completed,
                    "lessonsTotal": total,
                    "nextLessonId": next_lesson,
                    "progress": completed / total if total else 0,
                }
            )
        units_out.append(
            {
                "id": unit.id,
                "position": unit.position,
                "title": unit.title,
                "description": unit.description,
                "color": unit.color,
                "nodes": packed,
            }
        )

    return {
        "course": {
            "id": course.id,
            "title": course.title,
            "flag": course.flag,
            "fromLanguage": course.from_language,
            "toLanguage": course.to_language,
        },
        "units": units_out,
        "hearts": stats.hearts if stats else 5,
        "xp": stats.xp if stats else 0,
        "streak": stats.streak if stats else 0,
        "gems": stats.gems if stats else 0,
    }
