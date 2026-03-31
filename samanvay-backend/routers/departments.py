from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import Department, Permit

router = APIRouter()


@router.get("")
async def list_departments(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Department))
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "type": d.type,
            "contact_email": d.contact_email,
            "contact_phone": d.contact_phone,
            "officer_name": d.officer_name,
        }
        for d in res.scalars().all()
    ]


@router.post("")
async def create_department(payload: dict[str, Any], db: AsyncSession = Depends(get_db)):
    dept = Department(
        name=payload["name"],
        type=payload["type"],
        contact_email=payload.get("contact_email"),
        contact_phone=payload.get("contact_phone"),
        officer_name=payload.get("officer_name"),
    )
    db.add(dept)
    await db.flush()
    return {"id": str(dept.id), "name": dept.name, "type": dept.type}


@router.get("/{department_id}")
async def get_department(department_id: str, db: AsyncSession = Depends(get_db)):
    dept = await db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    res = await db.execute(select(Permit).where(Permit.department_id == dept.id))
    permits = res.scalars().all()
    return {
        "id": str(dept.id),
        "name": dept.name,
        "type": dept.type,
        "permits": [{"id": str(p.id), "permit_number": p.permit_number, "status": p.status} for p in permits],
    }


@router.get("/stats")
async def department_stats(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(
            Department.id,
            Department.name,
            func.count(Permit.id).label("total_permits"),
            func.sum(case((Permit.status == "active", 1), else_=0)).label("active_permits"),
            func.sum(case((Permit.status == "clashed", 1), else_=0)).label("clashed_permits"),
        ).join(Permit, Permit.department_id == Department.id, isouter=True)
        .group_by(Department.id, Department.name)
    )
    rows = res.fetchall()
    return [
        {
            "department_id": str(r.id),
            "department_name": r.name,
            "total_permits": int(r.total_permits or 0),
            "active_permits": int(r.active_permits or 0),
            "clashes": int(r.clashed_permits or 0),
        }
        for r in rows
    ]

