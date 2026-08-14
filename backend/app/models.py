from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(16), default="#58CC02")
    is_seeded_rival: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    stats: Mapped["UserStats"] = relationship(back_populates="user", uselist=False)
    skill_progress: Mapped[list["UserSkillProgress"]] = relationship(back_populates="user")
    node_progress: Mapped[list["UserNodeProgress"]] = relationship(back_populates="user")
    attempts: Mapped[list["LessonAttempt"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    from_language: Mapped[str] = mapped_column(String(40), nullable=False)
    to_language: Mapped[str] = mapped_column(String(40), nullable=False)
    flag: Mapped[str] = mapped_column(String(8), default="ES")

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course", order_by="Unit.position"
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(240), default="")
    color: Mapped[str] = mapped_column(String(16), default="#58CC02")

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", order_by="Skill.position"
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    lessons_total: Mapped[int] = mapped_column(Integer, default=1)

    unit: Mapped[Unit] = relationship(back_populates="skills")
    nodes: Mapped[list["PathNode"]] = relationship(back_populates="skill")


class PathNode(Base):
    __tablename__ = "path_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), nullable=False)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    node_type: Mapped[str] = mapped_column(String(20), default="lesson")

    skill: Mapped[Skill] = relationship(back_populates="nodes")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="path_node", order_by="Lesson.position"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    path_node_id: Mapped[int] = mapped_column(ForeignKey("path_nodes.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    path_node: Mapped[PathNode] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson", order_by="Exercise.position"
    )


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (UniqueConstraint("lesson_id", "position"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    correct_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")


class UserStats(Base):
    __tablename__ = "user_stats"
    __table_args__ = (
        CheckConstraint("hearts >= 0 AND hearts <= 5", name="hearts_range"),
        CheckConstraint("streak >= 0", name="streak_nonneg"),
        CheckConstraint("xp >= 0", name="xp_nonneg"),
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=0)
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    xp_today: Mapped[int] = mapped_column(Integer, default=0)
    xp_today_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped[User] = relationship(back_populates="stats")


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), nullable=False)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    crown_level: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="skill_progress")


class UserNodeProgress(Base):
    __tablename__ = "user_node_progress"
    __table_args__ = (UniqueConstraint("user_id", "path_node_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    path_node_id: Mapped[int] = mapped_column(ForeignKey("path_nodes.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="locked")

    user: Mapped[User] = relationship(back_populates="node_progress")


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[str] = mapped_column(String(16), default="in_progress")
    is_practice: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="attempts")
    answers: Mapped[list["AttemptAnswer"]] = relationship(back_populates="attempt")


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("lesson_attempts.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    attempt: Mapped[LessonAttempt] = relationship(back_populates="answers")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="achievements")
    achievement: Mapped[Achievement] = relationship()
