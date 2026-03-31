"""
Clash detection logic:
Two permits CLASH if:
1. Their trench polygons intersect (ST_Intersects = True), AND
2. Their date ranges overlap by at least 1 day
   OR their date ranges are within 180 days of each other (soft clash — recommend coordination)

Severity scoring:
- CRITICAL: Same polygon, same week
- HIGH: >50% polygon overlap, within 30 days
- MEDIUM: Any overlap, within 90 days
- LOW: Polygons within 50m buffer, within 180 days (near-miss warning)
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Clash, Permit


def _days_overlap(a_start: date, a_end: date, b_start: date, b_end: date) -> int:
    latest_start = max(a_start, b_start)
    earliest_end = min(a_end, b_end)
    delta = (earliest_end - latest_start).days
    return max(0, delta)


def calculate_severity(overlap_sqm: float | None, days_overlap: int, soft_distance_m: float | None = None) -> str:
    overlap = float(overlap_sqm or 0.0)
    if overlap > 100 and days_overlap > 0:
        return "critical"
    if overlap > 30 and days_overlap > 0:
        return "high"
    if overlap > 0 and days_overlap > 0:
        return "medium"
    if soft_distance_m is not None and soft_distance_m <= 50:
        return "low"
    return "low"


async def check_clashes(db: AsyncSession, new_permit_id: str) -> list[dict[str, Any]]:
    """
    Run against ALL existing pending/approved/active permits.
    Uses PostGIS query for polygon intersection / near-miss.
    Creates clash rows and returns created clashes (dict form).
    """
    query = text(
        """
        SELECT
            p.id as existing_permit_id,
            p.permit_number,
            p.department_id,
            p.road_name,
            p.ward,
            p.city,
            p.proposed_start_date,
            p.proposed_end_date,
            ST_Area(ST_Intersection(p.trench_polygon, np.trench_polygon)::geography) as overlap_sqm,
            ST_AsGeoJSON(ST_Intersection(p.trench_polygon, np.trench_polygon)) as overlap_geojson,
            ST_Distance(ST_Centroid(p.trench_polygon)::geography, ST_Centroid(np.trench_polygon)::geography) as centroid_distance_m
        FROM permits p
        CROSS JOIN permits np
        WHERE np.id = :new_id
          AND p.id != :new_id
          AND p.status IN ('pending', 'approved', 'active')
          AND (
              ST_Intersects(p.trench_polygon, np.trench_polygon)
              OR ST_DWithin(p.trench_polygon::geography, np.trench_polygon::geography, 50)
          )
          AND (
            (p.proposed_start_date <= np.proposed_end_date AND p.proposed_end_date >= np.proposed_start_date)
            OR ABS(EXTRACT(DAY FROM (p.proposed_start_date - np.proposed_end_date))) <= 180
          )
        """
    )

    result = await db.execute(query, {"new_id": new_permit_id})
    clashes_raw = result.fetchall()

    if not clashes_raw:
        return []

    new_uuid = uuid.UUID(new_permit_id)
    new_permit = await db.get(Permit, new_uuid)

    created: list[Clash] = []
    for row in clashes_raw:
        days = 0
        if new_permit is not None:
            days = _days_overlap(
                new_permit.proposed_start_date,
                new_permit.proposed_end_date,
                row.proposed_start_date,
                row.proposed_end_date,
            )
        severity = calculate_severity(row.overlap_sqm, days, soft_distance_m=row.centroid_distance_m)
        clash = Clash(
            permit_a_id=new_uuid,
            permit_b_id=row.existing_permit_id,
            overlap_area_sqm=row.overlap_sqm,
            overlap_geojson=row.overlap_geojson,
            days_overlap=int(days),
            severity=severity,
            status="open",
        )
        db.add(clash)
        created.append(clash)

    await db.flush()

    clash_ids = [c.permit_b_id for c in created if c.permit_b_id]
    if new_permit is not None:
        new_permit.clash_detected = True
        new_permit.clash_permit_ids = clash_ids
        new_permit.status = "clashed"

    return [
        {
            "id": str(c.id),
            "permit_a_id": str(c.permit_a_id) if c.permit_a_id else None,
            "permit_b_id": str(c.permit_b_id) if c.permit_b_id else None,
            "overlap_area_sqm": float(c.overlap_area_sqm) if c.overlap_area_sqm is not None else None,
            "overlap_geojson": c.overlap_geojson,
            "days_overlap": c.days_overlap,
            "severity": c.severity,
            "status": c.status,
        }
        for c in created
    ]

