from __future__ import annotations

import math
from typing import Any


def badge_level(score: float) -> str:
    if score <= 40:
        return "poor"
    if score <= 60:
        return "average"
    if score <= 80:
        return "good"
    return "excellent"


def calculate_contractor_score(contractor_data: dict[str, Any]) -> float:
    """
    Implements the scoring rules from the prompt (clamped to [0, 100]).

    Note: some inputs like incomplete_projects / safety_violations / streaks are optional and can be
    derived by routers if needed.
    """

    score = 100.0

    total = int(contractor_data.get("total_projects", 0) or 0)
    on_time = int(contractor_data.get("completed_on_time", 0) or 0)
    penalties = int(contractor_data.get("penalty_count", 0) or 0)
    safety_violations = int(contractor_data.get("safety_violations", 0) or 0)
    verified = bool(contractor_data.get("digilocker_verified", False))
    blacklisted = bool(contractor_data.get("is_blacklisted", False))

    incomplete_projects = int(contractor_data.get("incomplete_projects", 0) or 0)
    on_time_streak_5s = int(contractor_data.get("on_time_streak_5s", 0) or 0)
    zero_complaints_6m = bool(contractor_data.get("zero_complaints_6m", False))
    photo_verified_projects = int(contractor_data.get("photo_verified_projects", 0) or 0)

    if blacklisted:
        return 0.0

    if total > 0:
        late_ratio = max(0.0, (total - on_time) / total)
        score -= late_ratio * 30.0

    score -= incomplete_projects * 5.0
    score -= penalties * 3.0
    score -= safety_violations * 8.0

    score += min(20.0, on_time_streak_5s * 5.0)
    if zero_complaints_6m:
        score += 5.0
    if verified:
        score += 3.0
    score += photo_verified_projects * 2.0

    if not math.isfinite(score):
        score = 0.0

    return float(max(0.0, min(100.0, round(score, 2))))

