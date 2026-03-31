from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Contractor, Permit
from utils.scoring import calculate_contractor_score

router = APIRouter()


@router.get("")
async def list_contractors(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Contractor))
    contractors = res.scalars().all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "registration_number": c.registration_number,
            "performance_score": float(c.performance_score or 0),
            "digilocker_verified": c.digilocker_verified,
            "total_projects": c.total_projects,
            "completed_on_time": c.completed_on_time,
            "penalty_count": c.penalty_count,
            "is_blacklisted": c.is_blacklisted,
        }
        for c in contractors
    ]


@router.get("/{contractor_id}")
async def contractor_profile(contractor_id: str, db: AsyncSession = Depends(get_db)):
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    res = await db.execute(select(Permit).where(Permit.contractor_id == contractor.id))
    permits = res.scalars().all()
    return {
        "id": str(contractor.id),
        "name": contractor.name,
        "registration_number": contractor.registration_number,
        "performance_score": float(contractor.performance_score or 0),
        "history": [
            {
                "id": str(p.id),
                "permit_number": p.permit_number,
                "status": p.status,
                "road_name": p.road_name,
            }
            for p in permits
        ],
    }


@router.get("/leaderboard")
async def contractor_leaderboard(db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(Contractor).order_by(desc(Contractor.performance_score)))
        contractors = res.scalars().all()
    except Exception:
        return []
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "performance_score": float(c.performance_score or 0),
            "total_projects": c.total_projects,
            "penalty_count": c.penalty_count,
            "is_blacklisted": c.is_blacklisted,
        }
        for c in contractors
    ]


@router.patch("/{contractor_id}/score")
async def recalc_score(contractor_id: str, db: AsyncSession = Depends(get_db)):
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")

    data: dict[str, Any] = {
        "total_projects": contractor.total_projects,
        "completed_on_time": contractor.completed_on_time,
        "penalty_count": contractor.penalty_count,
        "digilocker_verified": contractor.digilocker_verified,
        "is_blacklisted": contractor.is_blacklisted,
    }
    new_score = calculate_contractor_score(data)
    contractor.performance_score = new_score
    return {"id": str(contractor.id), "performance_score": new_score}


@router.post("/{contractor_id}/penalty")
async def add_penalty(contractor_id: str, payload: dict[str, Any], db: AsyncSession = Depends(get_db)):
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    amount = float(payload.get("amount", 0))
    contractor.penalty_count += 1
    contractor.penalty_amount_inr = (contractor.penalty_amount_inr or 0) + amount
    return {
        "id": str(contractor.id),
        "penalty_count": contractor.penalty_count,
        "penalty_amount_inr": float(contractor.penalty_amount_inr or 0),
    }

