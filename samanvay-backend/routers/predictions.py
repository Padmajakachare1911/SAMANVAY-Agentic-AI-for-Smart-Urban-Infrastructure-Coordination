from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import RoadHealth
from ml.train import train

router = APIRouter()


@router.get("/roads")
async def list_roads(db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(RoadHealth))
        rows = res.scalars().all()
    except Exception:
        return []
    return [
        {
            "id": str(r.id),
            "road_name": r.road_name,
            "ward": r.ward,
            "predicted_dig_probability_90d": float(r.predicted_dig_probability_90d or 0)
            if r.predicted_dig_probability_90d
            else None,
        }
        for r in rows
    ]


@router.get("/roads/high-risk")
async def high_risk_roads(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(RoadHealth).where((RoadHealth.predicted_dig_probability_90d != None))  # noqa: E711
    )
    rows = res.scalars().all()
    out = [
        {
            "id": str(r.id),
            "road_name": r.road_name,
            "ward": r.ward,
            "predicted_dig_probability_90d": float(r.predicted_dig_probability_90d or 0),
        }
        for r in rows
        if float(r.predicted_dig_probability_90d or 0) > 0.65
    ]
    return out


@router.get("/roads/{road_name}")
async def road_prediction(road_name: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RoadHealth).where(RoadHealth.road_name == road_name))
    row = res.scalars().first()
    if not row:
        return {"road_name": road_name, "message": "No data"}
    return {
        "id": str(row.id),
        "road_name": row.road_name,
        "ward": row.ward,
        "predicted_dig_probability_90d": float(row.predicted_dig_probability_90d or 0),
    }


@router.post("/retrain")
async def retrain_model():
    acc = train()
    return {"message": "Model retrained", "validation_accuracy": acc}

