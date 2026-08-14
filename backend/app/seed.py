from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import (
    Achievement,
    Course,
    Exercise,
    Lesson,
    PathNode,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserNodeProgress,
    UserSkillProgress,
    UserStats,
)


def _mc(prompt: str, options: list[str], correct: str) -> dict:
    return {
        "type": "multiple_choice",
        "prompt": prompt,
        "payload": {
            "options": [{"id": opt.lower().replace(" ", "_"), "text": opt} for opt in options]
        },
        "correct": {"optionId": correct.lower().replace(" ", "_")},
    }


def _tap(prompt: str, tokens: list[str], correct: list[str], distractors: list[str]) -> dict:
    all_tokens = tokens + distractors
    payload_tokens = [{"id": i + 1, "text": t} for i, t in enumerate(all_tokens)]
    lookup = {t: i + 1 for i, t in enumerate(all_tokens)}
    return {
        "type": "translate_tap",
        "prompt": prompt,
        "payload": {"tokens": payload_tokens},
        "correct": {"tokenIds": [lookup[t] for t in correct]},
    }


def _match(pairs: list[tuple[str, str]]) -> dict:
    left = [{"id": f"l{i}", "text": a} for i, (a, _) in enumerate(pairs)]
    right = [{"id": f"r{i}", "text": b} for i, (_, b) in enumerate(pairs)]
    return {
        "type": "match_pairs",
        "prompt": "Tap the matching pairs",
        "payload": {"left": left, "right": right},
        "correct": {"pairs": [[f"l{i}", f"r{i}"] for i in range(len(pairs))]},
    }


def _blank(before: str, after: str, options: list[str], correct: str) -> dict:
    return {
        "type": "fill_blank",
        "prompt": "Fill in the blank",
        "payload": {
            "before": before,
            "after": after,
            "options": [{"id": o.lower(), "text": o} for o in options],
        },
        "correct": {"optionId": correct.lower()},
    }


def _type(prompt: str, text: str, aliases: list[str] | None = None) -> dict:
    return {
        "type": "type_answer",
        "prompt": prompt,
        "payload": {},
        "correct": {"text": text, "aliases": aliases or []},
    }


COURSE = {
    "slug": "es-en",
    "title": "Spanish",
    "from_language": "English",
    "to_language": "Spanish",
    "flag": "ES",
    "units": [
        {
            "title": "Solo trip: Compare travel experiences",
            "description": "Greet people and introduce yourself",
            "color": "#58CC02",
            "skills": [
                {
                    "title": "Greetings",
                    "lessons": [
                        {
                            "title": "Say hello",
                            "exercises": [
                                _mc("Which one means “hello”?", ["Hola", "Adiós", "Gracias", "Agua"], "Hola"),
                                _tap("Translate: Hello", ["Hola"], ["Hola"], ["Adiós", "Gracias", "Por"]),
                                _match([("Hello", "Hola"), ("Goodbye", "Adiós"), ("Thanks", "Gracias"), ("Please", "Por favor")]),
                                _blank("¡", ", amigos!", ["Hola", "Agua", "Libro"], "Hola"),
                                _type("Type the Spanish for “hello”", "hola", ["¡hola!", "hola!"]),
                            ],
                        },
                        {
                            "title": "Be polite",
                            "exercises": [
                                _mc("Which one means “thank you”?", ["Gracias", "Hola", "Perro", "Uno"], "Gracias"),
                                _tap("Translate: Please", ["Por", "favor"], ["Por", "favor"], ["Gracias", "Hola"]),
                                _match([("Thank you", "Gracias"), ("Please", "Por favor"), ("Yes", "Sí"), ("No", "No")]),
                                _blank("", "por la ayuda.", ["Gracias", "Adiós", "Leche"], "Gracias"),
                                _type("Type the Spanish for “thanks”", "gracias"),
                            ],
                        },
                    ],
                },
                {
                    "title": "Introductions",
                    "lessons": [
                        {
                            "title": "I am…",
                            "exercises": [
                                _mc("“Yo soy” means…", ["I am", "You are", "I eat", "The house"], "I am"),
                                _tap("Translate: I am Maria", ["Yo", "soy", "María"], ["Yo", "soy", "María"], ["tú", "es"]),
                                _match([("I", "Yo"), ("You", "Tú"), ("Am", "Soy"), ("Name", "Nombre")]),
                                _blank("Yo", "Luis.", ["soy", "como", "tengo"], "soy"),
                                _type("Type the Spanish for “I am”", "yo soy", ["soy"]),
                            ],
                        },
                        {
                            "title": "Nice to meet you",
                            "exercises": [
                                _mc("How do you say “nice to meet you”?", ["Mucho gusto", "Buenos días", "De nada", "Hasta luego"], "Mucho gusto"),
                                _tap("Translate: My name is Ana", ["Me", "llamo", "Ana"], ["Me", "llamo", "Ana"], ["Yo", "soy"]),
                                _match([("Nice to meet you", "Mucho gusto"), ("My name is", "Me llamo"), ("Good morning", "Buenos días"), ("See you later", "Hasta luego")]),
                                _blank("Me", "Carlos.", ["llamo", "como", "voy"], "llamo"),
                                _type("Type “mucho gusto”", "mucho gusto"),
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "title": "Solo trip: Ask about transportation",
            "description": "Ask for places and directions",
            "color": "#1CB0F6",
            "skills": [
                {
                    "title": "Places",
                    "lessons": [
                        {
                            "title": "Where is it?",
                            "exercises": [
                                _mc("“Dónde” means…", ["Where", "When", "Who", "Why"], "Where"),
                                _tap("Translate: Where is the cafe?", ["¿Dónde", "está", "el", "café?"], ["¿Dónde", "está", "el", "café?"], ["la", "casa"]),
                                _match([("Cafe", "Café"), ("School", "Escuela"), ("House", "Casa"), ("Park", "Parque")]),
                                _blank("¿", "está el parque?", ["Dónde", "Cómo", "Qué"], "dónde"),
                                _type("Type the Spanish for “house”", "casa"),
                            ],
                        },
                        {
                            "title": "The city",
                            "exercises": [
                                _mc("Which one is “the museum”?", ["El museo", "La playa", "El perro", "La leche"], "El museo"),
                                _tap("Translate: The park is big", ["El", "parque", "es", "grande"], ["El", "parque", "es", "grande"], ["casa", "rojo"]),
                                _match([("Museum", "Museo"), ("Beach", "Playa"), ("Street", "Calle"), ("City", "Ciudad")]),
                                _blank("El museo es", ".", ["grande", "leche", "hola"], "grande"),
                                _type("Type the Spanish for “city”", "ciudad"),
                            ],
                        },
                    ],
                },
                {
                    "title": "Directions",
                    "lessons": [
                        {
                            "title": "Left and right",
                            "exercises": [
                                _mc("“Izquierda” means…", ["Left", "Right", "Straight", "Stop"], "Left"),
                                _tap("Translate: Turn right", ["Gira", "a", "la", "derecha"], ["Gira", "a", "la", "derecha"], ["izquierda", "para"]),
                                _match([("Left", "Izquierda"), ("Right", "Derecha"), ("Straight", "Recto"), ("Here", "Aquí")]),
                                _blank("Gira a la", ".", ["derecha", "casa", "leche"], "derecha"),
                                _type("Type the Spanish for “left”", "izquierda"),
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "title": "Solo trip: Order food and drinks",
            "description": "Order food and drinks",
            "color": "#FF9600",
            "skills": [
                {
                    "title": "Food",
                    "lessons": [
                        {
                            "title": "I want…",
                            "exercises": [
                                _mc("Which one means “bread”?", ["Pan", "Agua", "Mesa", "Cuchara"], "Pan"),
                                _tap("Translate: I want water", ["Quiero", "agua"], ["Quiero", "agua"], ["leche", "pan", "el"]),
                                _match([("Bread", "Pan"), ("Water", "Agua"), ("Milk", "Leche"), ("Apple", "Manzana")]),
                                _blank("Quiero", ".", ["pan", "hola", "calle"], "pan"),
                                _type("Type the Spanish for “water”", "agua"),
                            ],
                        },
                    ],
                },
                {
                    "title": "Restaurant",
                    "lessons": [
                        {
                            "title": "At the table",
                            "exercises": [
                                _mc("How do you say “the check”?", ["La cuenta", "La mesa", "El menú", "El plato"], "La cuenta"),
                                _tap("Translate: The menu please", ["El", "menú", "por", "favor"], ["El", "menú", "por", "favor"], ["cuenta", "agua"]),
                                _match([("The check", "La cuenta"), ("Menu", "Menú"), ("Plate", "Plato"), ("Table", "Mesa")]),
                                _blank("La", ", por favor.", ["cuenta", "casa", "calle"], "cuenta"),
                                _type("Type the Spanish for “menu”", "menu", ["menú"]),
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}


RIVALS = [
    ("Priya", "#CE82FF", 410),
    ("Alex", "#1CB0F6", 355),
    ("Sam", "#FF9600", 280),
    ("Jordan", "#FF4B4B", 190),
    ("Riley", "#FFC800", 95),
    ("Kai", "#2B70C9", 60),
]


ACHIEVEMENTS = [
    ("first_lesson", "First lesson", "Complete your first lesson"),
    ("streak_3", "On a roll", "Reach a 3-day streak"),
    ("xp_100", "Century", "Earn 100 XP"),
    ("out_of_hearts", "Heartbreaker", "Run out of hearts"),
]


def _add_exercise(db: Session, lesson_id: int, position: int, spec: dict) -> None:
    db.add(
        Exercise(
            lesson_id=lesson_id,
            position=position,
            type=spec["type"],
            prompt=spec["prompt"],
            payload_json=spec["payload"],
            correct_json=spec["correct"],
        )
    )


def seed(db: Session) -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    learner = User(id=1, display_name="Manish", avatar_color="#58CC02", is_seeded_rival=False)
    db.add(learner)
    db.flush()

    yesterday = date.today() - timedelta(days=1)
    db.add(
        UserStats(
            user_id=1,
            xp=120,
            gems=250,
            hearts=5,
            hearts_updated_at=datetime.utcnow(),
            streak=4,
            last_active_date=yesterday,
            daily_goal_xp=20,
            xp_today=0,
            xp_today_date=yesterday,
        )
    )

    for i, (name, color, xp) in enumerate(RIVALS, start=2):
        db.add(User(id=i, display_name=name, avatar_color=color, is_seeded_rival=True))
        db.add(
            UserStats(
                user_id=i,
                xp=xp,
                gems=0,
                hearts=5,
                streak=max(1, xp // 80),
                last_active_date=date.today(),
            )
        )

    for code, title, desc in ACHIEVEMENTS:
        db.add(Achievement(code=code, title=title, description=desc))
    db.flush()

    first = db.query(Achievement).filter_by(code="first_lesson").one()
    streak = db.query(Achievement).filter_by(code="streak_3").one()
    century = db.query(Achievement).filter_by(code="xp_100").one()
    db.add(UserAchievement(user_id=1, achievement_id=first.id))
    db.add(UserAchievement(user_id=1, achievement_id=streak.id))
    db.add(UserAchievement(user_id=1, achievement_id=century.id))

    course = Course(
        slug=COURSE["slug"],
        title=COURSE["title"],
        from_language=COURSE["from_language"],
        to_language=COURSE["to_language"],
        flag=COURSE["flag"],
    )
    db.add(course)
    db.flush()

    path_position = 0
    created_nodes: list[PathNode] = []
    skill_lesson_counts: dict[int, int] = {}

    for u_idx, unit_spec in enumerate(COURSE["units"], start=1):
        unit = Unit(
            course_id=course.id,
            position=u_idx,
            title=unit_spec["title"],
            description=unit_spec["description"],
            color=unit_spec["color"],
        )
        db.add(unit)
        db.flush()

        for s_idx, skill_spec in enumerate(unit_spec["skills"], start=1):
            skill = Skill(
                unit_id=unit.id,
                position=s_idx,
                title=skill_spec["title"],
                lessons_total=len(skill_spec["lessons"]),
            )
            db.add(skill)
            db.flush()
            skill_lesson_counts[skill.id] = skill.lessons_total

            path_position += 1
            node = PathNode(
                skill_id=skill.id,
                unit_id=unit.id,
                position=path_position,
                node_type="lesson",
            )
            db.add(node)
            db.flush()
            created_nodes.append(node)

            for l_idx, lesson_spec in enumerate(skill_spec["lessons"], start=1):
                lesson = Lesson(
                    path_node_id=node.id,
                    position=l_idx,
                    title=lesson_spec["title"],
                    xp_reward=10,
                )
                db.add(lesson)
                db.flush()
                for e_idx, ex in enumerate(lesson_spec["exercises"], start=1):
                    _add_exercise(db, lesson.id, e_idx, ex)

            if s_idx == len(unit_spec["skills"]):
                path_position += 1
                practice_skill = Skill(
                    unit_id=unit.id,
                    position=s_idx + 1,
                    title=f"{unit_spec['title']} practice",
                    lessons_total=1,
                )
                db.add(practice_skill)
                db.flush()
                practice_node = PathNode(
                    skill_id=practice_skill.id,
                    unit_id=unit.id,
                    position=path_position,
                    node_type="practice",
                )
                db.add(practice_node)
                db.flush()
                created_nodes.append(practice_node)
                practice_lesson = Lesson(
                    path_node_id=practice_node.id,
                    position=1,
                    title="Practice",
                    xp_reward=5,
                )
                db.add(practice_lesson)
                db.flush()
                # Reuse a compact mixed set for practice
                for e_idx, ex in enumerate(
                    [
                        _mc("Quick review: “hola” means…", ["Hello", "Water", "Bread", "Left"], "Hello"),
                        _type("Type “gracias”", "gracias"),
                        _match([("Hello", "Hola"), ("Water", "Agua"), ("Bread", "Pan")]),
                    ],
                    start=1,
                ):
                    _add_exercise(db, practice_lesson.id, e_idx, ex)

    db.flush()

    # Seed learner progress: first unit complete, first node of unit 2 active
    unit1_nodes = [n for n in created_nodes if n.unit_id == 1]
    # After flush, unit ids: first unit is 1
    # created_nodes are in order. Unit 1 has 2 lesson nodes + 1 practice = 3
    for i, node in enumerate(created_nodes):
        if i < 3:
            status = "complete"
        elif i == 3:
            status = "active"
        else:
            status = "locked"
        db.add(UserNodeProgress(user_id=1, path_node_id=node.id, status=status))

        if status == "complete":
            skill_total = skill_lesson_counts.get(node.skill_id, 1)
            db.add(
                UserSkillProgress(
                    user_id=1,
                    skill_id=node.skill_id,
                    lessons_completed=skill_total,
                    crown_level=1,
                    completed_at=datetime.utcnow() - timedelta(days=1),
                )
            )
        elif status == "active":
            db.add(
                UserSkillProgress(
                    user_id=1,
                    skill_id=node.skill_id,
                    lessons_completed=0,
                    crown_level=0,
                )
            )

    db.commit()


def run() -> None:
    db = SessionLocal()
    try:
        seed(db)
        print("Seeded duolingo.db")
    finally:
        db.close()


if __name__ == "__main__":
    run()
