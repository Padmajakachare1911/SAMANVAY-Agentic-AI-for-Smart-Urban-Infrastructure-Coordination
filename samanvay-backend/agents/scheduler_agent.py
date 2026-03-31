from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Permit


@dataclass
class ScheduleItem:
    permit_id: str
    permit_number: str
    road_name: str
    ward: str
    proposed_start_date: str
    proposed_end_date: str
    recommended_start_date: str
    recommended_end_date: str


async def optimize_schedule_for_ward(db: AsyncSession, ward: str) -> dict[str, Any]:
    """
    Simple "Dig-Once" scheduler: groups permits by road_name and aligns them into a joint window
    by pushing starts forward to avoid overlapping too many separate road closures.
    """
    res = await db.execute(
        select(Permit).where(Permit.ward == ward, Permit.status.in_(["pending", "approved", "active", "clashed"]))
    )
    permits = res.scalars().all()
    if not permits:
        return {"ward": ward, "items": [], "message": "No permits found"}

    permits_sorted = sorted(permits, key=lambda p: (p.road_name, p.proposed_start_date))

    items: list[ScheduleItem] = []
    current_road = None
    cursor_date: date | None = None
    for p in permits_sorted:
        if p.road_name != current_road:
            current_road = p.road_name
            cursor_date = p.proposed_start_date

        start = max(p.proposed_start_date, cursor_date or p.proposed_start_date)
        duration = (p.proposed_end_date - p.proposed_start_date).days or 1
        end = start + timedelta(days=duration)
        cursor_date = end + timedelta(days=1)

        items.append(
            ScheduleItem(
                permit_id=str(p.id),
                permit_number=p.permit_number,
                road_name=p.road_name,
                ward=p.ward,
                proposed_start_date=str(p.proposed_start_date),
                proposed_end_date=str(p.proposed_end_date),
                recommended_start_date=str(start),
                recommended_end_date=str(end),
            )
        )

    return {"ward": ward, "items": [i.__dict__ for i in items]}

