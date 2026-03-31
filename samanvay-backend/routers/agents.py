from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.clash_agent import check_clashes
from agents.negotiation_agent import run_negotiation
from agents.scheduler_agent import optimize_schedule_for_ward
from database.connection import get_db
from database.models import AgentLog, Clash

router = APIRouter()


@router.post("/clash-check/{permit_id}")
async def manual_clash_check(permit_id: str, db: AsyncSession = Depends(get_db)):
    clashes = await check_clashes(db, permit_id)
    return {"permit_id": permit_id, "clashes": clashes}


@router.post("/negotiate/{clash_id}")
async def negotiate(clash_id: str, db: AsyncSession = Depends(get_db)):
    result = await run_negotiation(db, clash_id)
    return result


@router.post("/schedule-optimize")
async def schedule_optimize(ward: str, db: AsyncSession = Depends(get_db)):
    return await optimize_schedule_for_ward(db, ward)


@router.get("/logs")
async def agent_logs(db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(AgentLog).order_by(AgentLog.created_at.desc()).limit(50))
        logs = res.scalars().all()
    except Exception:
        return []
    return [
        {
            "id": str(l.id),
            "agent_name": l.agent_name,
            "status": l.status,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]

