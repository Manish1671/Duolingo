from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field


class CheckAnswerIn(BaseModel):
    exerciseId: int
    answer: dict[str, Any] = Field(default_factory=dict)
    leftId: str | None = None
    rightId: str | None = None


class GoalIn(BaseModel):
    dailyGoalXp: int


class SimulateQuery(BaseModel):
    simulateDate: date | None = None
