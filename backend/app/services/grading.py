from __future__ import annotations

import re
import unicodedata
from typing import Any


def _norm(text: str) -> str:
    cleaned = text.strip().lower()
    cleaned = unicodedata.normalize("NFD", cleaned)
    cleaned = "".join(ch for ch in cleaned if unicodedata.category(ch) != "Mn")
    cleaned = re.sub(r"[¡!¿?.,;:'\"]+", "", cleaned)
    return re.sub(r"\s+", " ", cleaned)


def grade_exercise(exercise_type: str, correct: dict[str, Any], answer: dict[str, Any]) -> tuple[bool, Any]:
    """Pure grader. Returns (is_correct, expected_payload_for_client)."""
    if exercise_type == "multiple_choice":
        expected = correct.get("optionId")
        return answer.get("optionId") == expected, expected

    if exercise_type == "fill_blank":
        if "optionId" in correct:
            expected = correct.get("optionId")
            return answer.get("optionId") == expected, expected
        expected = _norm(str(correct.get("text", "")))
        aliases = [_norm(a) for a in correct.get("aliases", [])]
        got = _norm(str(answer.get("text", "")))
        return got == expected or got in aliases, correct.get("text")

    if exercise_type == "type_answer":
        expected = _norm(str(correct.get("text", "")))
        aliases = [_norm(a) for a in correct.get("aliases", [])]
        got = _norm(str(answer.get("text", "")))
        return got == expected or got in aliases, correct.get("text")

    if exercise_type == "translate_tap":
        expected = [int(x) for x in correct.get("tokenIds", [])]
        got = [int(x) for x in answer.get("tokenIds", [])]
        return got == expected, expected

    if exercise_type == "match_pairs":
        expected_pairs = {tuple(sorted((str(a), str(b)))) for a, b in correct.get("pairs", [])}
        got_pairs = {tuple(sorted((str(a), str(b)))) for a, b in answer.get("pairs", [])}
        return got_pairs == expected_pairs and len(got_pairs) == len(expected_pairs), correct.get("pairs")

    return False, None


def grade_match_pair(correct: dict[str, Any], left_id: str, right_id: str) -> bool:
    expected = {str(a): str(b) for a, b in correct.get("pairs", [])}
    expected.update({str(b): str(a) for a, b in correct.get("pairs", [])})
    return expected.get(str(left_id)) == str(right_id)
