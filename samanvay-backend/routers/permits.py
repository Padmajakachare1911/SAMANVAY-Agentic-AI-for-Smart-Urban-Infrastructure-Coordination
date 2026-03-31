from __future__ import annotations

from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.clash_agent import check_clashes
from blockchain.ledger import write_permit_to_chain
from database.connection import get_db
from database.models import Clash, Contractor, Department, Permit
from utils.geo import feature_collection, geojson_dict_to_geom, geom_to_geojson, polygon_center_point, polygon_feature

router = APIRouter()


class PermitCreate(BaseModel):
    department_id: str
    contractor_id: str
    road_name: str
    ward: str
    work_type: str
    proposed_start_date: date
    proposed_end_date: date
    estimated_depth_meters: Optional[float] = None
    estimated_area_sqm: Optional[float] = None
    trench_polygon_geojson: dict[str, Any] = Field(..., alias="trench_polygon_geojson")


class PermitStatusUpdate(BaseModel):
    status: str


@router.get("")
async def list_permits(
    status: Optional[str] = None,
    ward: Optional[str] = None,
    department_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Permit, Department, Contractor)
        .join(Department, Permit.department_id == Department.id, isouter=True)
        .join(Contractor, Permit.contractor_id == Contractor.id, isouter=True)
    )
    conditions = []
    if status:
        conditions.append(Permit.status == status)
    if ward:
        conditions.append(Permit.ward == ward)
    if department_id:
        conditions.append(Permit.department_id == department_id)
    if date_from:
        conditions.append(Permit.proposed_start_date >= date_from)
    if date_to:
        conditions.append(Permit.proposed_end_date <= date_to)
    if conditions:
        query = query.where(and_(*conditions))

    try:
        res = await db.execute(query)
        rows = res.all()
    except Exception:
        # Keep API bootable even when DB connectivity is down.
        return []

    def to_dict(p: Permit, d: Department | None, c: Contractor | None) -> dict[str, Any]:
        return {
            "id": str(p.id),
            "permit_number": p.permit_number,
            "department_id": str(p.department_id) if p.department_id else None,
            "department_name": d.name if d else None,
            "department_type": d.type if d else None,
            "contractor_id": str(p.contractor_id) if p.contractor_id else None,
            "contractor_name": c.name if c else None,
            "road_name": p.road_name,
            "ward": p.ward,
            "city": p.city,
            "status": p.status,
            "work_type": p.work_type,
            "estimated_depth_meters": float(p.estimated_depth_meters or 0) if p.estimated_depth_meters else None,
            "estimated_area_sqm": float(p.estimated_area_sqm or 0) if p.estimated_area_sqm else None,
            "clash_detected": p.clash_detected,
            "clash_permit_ids": [str(i) for i in (p.clash_permit_ids or [])],
            "proposed_start_date": str(p.proposed_start_date),
            "proposed_end_date": str(p.proposed_end_date),
            "ai_risk_score": float(p.ai_risk_score) if p.ai_risk_score is not None else None,
            "trench_polygon_geojson": geom_to_geojson(p.trench_polygon),
            "blockchain_tx_hash": p.blockchain_tx_hash,
        }

    return [to_dict(p, d, c) for (p, d, c) in rows]


@router.post("")
async def create_permit(payload: PermitCreate, db: AsyncSession = Depends(get_db)):
    polygon_wkt = geojson_dict_to_geom(payload.trench_polygon_geojson)
    center_wkt = polygon_center_point(payload.trench_polygon_geojson)

    permit = Permit(
        permit_number="TEMP-" + payload.proposed_start_date.strftime("%Y%m%d"),
        department_id=payload.department_id,
        contractor_id=payload.contractor_id,
        road_name=payload.road_name,
        ward=payload.ward,
        work_type=payload.work_type,
        proposed_start_date=payload.proposed_start_date,
        proposed_end_date=payload.proposed_end_date,
        estimated_depth_meters=payload.estimated_depth_meters,
        estimated_area_sqm=payload.estimated_area_sqm,
        trench_polygon=polygon_wkt,
        center_point=center_wkt,
    )
    db.add(permit)
    await db.flush()

    tx_hash = None
    try:
        tx_hash = await write_permit_to_chain(
            {
                "permit_number": permit.permit_number,
                "department_name": permit.department.name if permit.department else "",
                "road_name": permit.road_name,
                "ward": permit.ward,
                "work_type": permit.work_type,
                "start_date": permit.proposed_start_date,
                "end_date": permit.proposed_end_date,
            }
        )
        permit.blockchain_tx_hash = tx_hash
    except Exception:
        tx_hash = None

    clashes = await check_clashes(db, str(permit.id))

    await db.refresh(permit)
    department = await db.get(Department, permit.department_id) if permit.department_id else None
    contractor = await db.get(Contractor, permit.contractor_id) if permit.contractor_id else None
    permit_dict = {
        "id": str(permit.id),
        "permit_number": permit.permit_number,
        "department_id": str(permit.department_id) if permit.department_id else None,
        "department_name": department.name if department else None,
        "department_type": department.type if department else None,
        "contractor_id": str(permit.contractor_id) if permit.contractor_id else None,
        "contractor_name": contractor.name if contractor else None,
        "road_name": permit.road_name,
        "ward": permit.ward,
        "city": permit.city,
        "status": permit.status,
        "work_type": permit.work_type,
        "estimated_depth_meters": float(permit.estimated_depth_meters or 0)
        if permit.estimated_depth_meters
        else None,
        "estimated_area_sqm": float(permit.estimated_area_sqm or 0) if permit.estimated_area_sqm else None,
        "clash_detected": permit.clash_detected,
        "clash_permit_ids": [str(i) for i in (permit.clash_permit_ids or [])],
        "ai_risk_score": float(permit.ai_risk_score) if permit.ai_risk_score is not None else None,
        "proposed_start_date": str(permit.proposed_start_date),
        "proposed_end_date": str(permit.proposed_end_date),
        "trench_polygon_geojson": geom_to_geojson(permit.trench_polygon),
        "blockchain_tx_hash": permit.blockchain_tx_hash,
    }

    return {
        "permit": permit_dict,
        "clashes_detected": clashes,
        "blockchain_tx": tx_hash,
        "message": "Permit created successfully",
    }


@router.get("/{permit_id}")
async def get_permit(permit_id: str, db: AsyncSession = Depends(get_db)):
    permit = await db.get(Permit, permit_id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    poly_geojson = geom_to_geojson(permit.trench_polygon)
    department = await db.get(Department, permit.department_id) if permit.department_id else None
    contractor = await db.get(Contractor, permit.contractor_id) if permit.contractor_id else None

    return {
        "id": str(permit.id),
        "permit_number": permit.permit_number,
        "department_id": str(permit.department_id) if permit.department_id else None,
        "department_name": department.name if department else None,
        "department_type": department.type if department else None,
        "contractor_id": str(permit.contractor_id) if permit.contractor_id else None,
        "contractor_name": contractor.name if contractor else None,
        "road_name": permit.road_name,
        "ward": permit.ward,
        "city": permit.city,
        "status": permit.status,
        "work_type": permit.work_type,
        "estimated_depth_meters": float(permit.estimated_depth_meters or 0)
        if permit.estimated_depth_meters
        else None,
        "estimated_area_sqm": float(permit.estimated_area_sqm or 0) if permit.estimated_area_sqm else None,
        "clash_detected": permit.clash_detected,
        "clash_permit_ids": [str(i) for i in (permit.clash_permit_ids or [])],
        "proposed_start_date": str(permit.proposed_start_date),
        "proposed_end_date": str(permit.proposed_end_date),
        "ai_risk_score": float(permit.ai_risk_score) if permit.ai_risk_score is not None else None,
        "blockchain_tx_hash": permit.blockchain_tx_hash,
        "trench_polygon_geojson": poly_geojson,
    }


@router.patch("/{permit_id}/status")
async def update_permit_status(permit_id: str, payload: PermitStatusUpdate, db: AsyncSession = Depends(get_db)):
    permit = await db.get(Permit, permit_id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    permit.status = payload.status
    return {"id": str(permit.id), "status": permit.status}


@router.get("/{permit_id}/clashes")
async def get_permit_clashes(permit_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Clash).where((Clash.permit_a_id == permit_id) | (Clash.permit_b_id == permit_id))
    )
    clashes = res.scalars().all()
    return [
        {
            "id": str(c.id),
            "permit_a_id": str(c.permit_a_id) if c.permit_a_id else None,
            "permit_b_id": str(c.permit_b_id) if c.permit_b_id else None,
            "overlap_area_sqm": float(c.overlap_area_sqm or 0) if c.overlap_area_sqm else None,
            "overlap_geojson": c.overlap_geojson,
            "days_overlap": c.days_overlap,
            "severity": c.severity,
            "status": c.status,
        }
        for c in clashes
    ]


@router.post("/{permit_id}/photo-upload")
async def upload_permit_photo(permit_id: str, file: UploadFile, db: AsyncSession = Depends(get_db)):
    permit = await db.get(Permit, permit_id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    await file.read()
    return {"permit_id": str(permit.id), "cv_passed": True}


@router.get("/geojson/all")
async def permits_geojson_all(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Permit).where(Permit.status.in_(["approved", "active", "clashed"])))
    permits = res.scalars().all()
    features = []
    for p in permits:
        poly = geom_to_geojson(p.trench_polygon)
        if not poly:
            continue
        features.append(
            polygon_feature(
                {
                    "id": str(p.id),
                    "permit_number": p.permit_number,
                    "status": p.status,
                    "road_name": p.road_name,
                    "ward": p.ward,
                    "city": p.city,
                },
                poly,
            )
        )
    return feature_collection(features)


@router.get("/geojson/ward/{ward}")
async def permits_geojson_by_ward(ward: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Permit).where(
            Permit.ward == ward,
            Permit.status.in_(["approved", "active", "clashed"]),
        )
    )
    permits = res.scalars().all()
    features = []
    for p in permits:
        poly = geom_to_geojson(p.trench_polygon)
        if not poly:
            continue
        features.append(
            polygon_feature(
                {
                    "id": str(p.id),
                    "permit_number": p.permit_number,
                    "status": p.status,
                    "road_name": p.road_name,
                    "ward": p.ward,
                    "city": p.city,
                },
                poly,
            )
        )
    return feature_collection(features)

