from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.complaint_agent import classify
from database.connection import get_db
from database.models import CitizenPoints, Complaint, Department, Permit

router = APIRouter()


class ComplaintCreate(BaseModel):
    permit_id: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_name: Optional[str] = None
    raw_text: str
    language: Optional[str] = "en"
    photo_url: Optional[str] = None


@router.post("")
async def submit_complaint(payload: ComplaintCreate, db: AsyncSession = Depends(get_db)):
    complaint = Complaint(
        permit_id=payload.permit_id,
        citizen_phone=payload.citizen_phone,
        citizen_name=payload.citizen_name,
        raw_text=payload.raw_text,
        language=payload.language or "en",
        photo_url=payload.photo_url,
    )
    db.add(complaint)
    await db.flush()

    ai = await classify(payload.raw_text)
    complaint.category = ai.get("category")
    complaint.priority = ai.get("priority")
    complaint.ai_summary = ai.get("summary_english")
    complaint.sentiment = ai.get("sentiment")

    dept_type = ai.get("department_to_assign")
    if dept_type:
        res = await db.execute(select(Department).where(Department.type == dept_type))
        dept = res.scalars().first()
        if dept:
            complaint.department_assigned = dept.id

    if payload.citizen_phone:
        res = await db.execute(select(CitizenPoints).where(CitizenPoints.citizen_phone == payload.citizen_phone))
        cp = res.scalars().first()
        if not cp:
            cp = CitizenPoints(citizen_phone=payload.citizen_phone, citizen_name=payload.citizen_name, total_points=0)
            db.add(cp)
            await db.flush()
        award = 5 if payload.photo_url else 1
        cp.total_points += award
        cp.verified_reports += 1
        complaint.citizen_points_awarded = award

    return {"id": str(complaint.id), "ai_classification": ai}


@router.get("")
async def list_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    ward: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Complaint, Permit, Department)
        .join(Permit, Complaint.permit_id == Permit.id, isouter=True)
        .join(Department, Complaint.department_assigned == Department.id, isouter=True)
    )
    conditions = []
    if status:
        conditions.append(Complaint.status == status)
    if priority:
        conditions.append(Complaint.priority == priority)
    if ward:
        conditions.append(Permit.ward == ward)
    if conditions:
        query = query.where(and_(*conditions))
    try:
        res = await db.execute(query)
        rows = res.all()
    except Exception:
        return []
    return [
        {
            "id": str(c.id),
            "raw_text": c.raw_text,
            "priority": c.priority,
            "status": c.status,
            "category": c.category,
            "ward": p.ward if p else None,
            "department_assigned": d.type if d else None,
            "citizen_points_awarded": c.citizen_points_awarded,
        }
        for (c, p, d) in rows
    ]


@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str, db: AsyncSession = Depends(get_db)):
    complaint = await db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    permit = await db.get(Permit, complaint.permit_id) if complaint.permit_id else None
    dept = await db.get(Department, complaint.department_assigned) if complaint.department_assigned else None
    return {
        "id": str(complaint.id),
        "raw_text": complaint.raw_text,
        "language": complaint.language,
        "category": complaint.category,
        "priority": complaint.priority,
        "ai_summary": complaint.ai_summary,
        "sentiment": complaint.sentiment,
        "status": complaint.status,
        "citizen_points_awarded": complaint.citizen_points_awarded,
        "ward": permit.ward if permit else None,
        "department_assigned": dept.type if dept else None,
    }


@router.patch("/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: str, payload: dict[str, Any], db: AsyncSession = Depends(get_db)):
    complaint = await db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = "resolved"
    complaint.resolution_notes = payload.get("resolution_notes")
    return {"id": str(complaint.id), "status": complaint.status}


@router.get("/stats")
async def complaint_stats(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(
            Complaint.category,
            Complaint.priority,
            Complaint.status,
            func.count(Complaint.id).label("count"),
        ).group_by(Complaint.category, Complaint.priority, Complaint.status)
    )
    rows = res.fetchall()
    return [
        {
            "category": r.category,
            "priority": r.priority,
            "status": r.status,
            "count": int(r.count or 0),
        }
        for r in rows
    ]

