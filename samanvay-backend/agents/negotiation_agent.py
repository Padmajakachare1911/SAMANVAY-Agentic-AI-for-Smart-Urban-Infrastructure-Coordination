from __future__ import annotations

import json
import os
import time
from datetime import datetime
from typing import Any

from groq import AsyncGroq
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Clash, Department, Permit
from utils.pdf import generate_mou_pdf


groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

NEGOTIATION_PROMPT = """
You are SAMANVAY's AI Negotiation Agent for urban infrastructure coordination in Indian cities.

Two departments want to dig the SAME road. Your job is to generate a fair joint coordination plan.

PERMIT A (Department: {dept_a_name}, Type: {dept_a_type}):
- Work: {work_a}
- Planned dates: {start_a} to {end_a}
- Estimated cost: ₹{cost_a}
- Overlap area: {overlap_sqm} sq meters

PERMIT B (Department: {dept_b_name}, Type: {dept_b_type}):
- Work: {work_b}
- Planned dates: {start_b} to {end_b}
- Estimated cost: ₹{cost_b}

Road: {road_name}, Ward: {ward}, City: {city}

RULES FOR YOUR RESPONSE:
1. Propose ONE joint dig window that works for both
2. The department with deeper work should go first (trenching order)
3. Cost split should be proportional to estimated work area
4. Citizen disruption should be minimized (fewer total days blocked)
5. Output ONLY valid JSON, no markdown, no explanation outside the JSON

Respond with this exact JSON structure:
{{
  "joint_start_date": "YYYY-MM-DD",
  "joint_end_date": "YYYY-MM-DD",
  "lead_department": "name",
  "trenching_order": ["dept 1 goes first", "dept 2 follows after N days"],
  "coordination_plan": "detailed paragraph",
  "cost_split": {{"dept_a_name": "X%", "dept_b_name": "Y%"}},
  "cost_split_reasoning": "explanation",
  "total_road_closure_days": 0,
  "days_saved_vs_separate": 0,
  "citizen_impact_days_saved": 0,
  "mou_clauses": [
    "Clause 1: ...",
    "Clause 2: ...",
    "Clause 3: ...",
    "Clause 4: ...",
    "Clause 5: ..."
  ]
}}
""".strip()


async def run_negotiation(db: AsyncSession, clash_id: str) -> dict[str, Any]:
    t0 = time.time()

    clash = await db.get(Clash, clash_id)
    if clash is None:
        raise ValueError("Clash not found")

    permit_a = await db.get(Permit, clash.permit_a_id) if clash.permit_a_id else None
    permit_b = await db.get(Permit, clash.permit_b_id) if clash.permit_b_id else None
    if permit_a is None or permit_b is None:
        raise ValueError("Permits for clash not found")

    dept_ids = [permit_a.department_id, permit_b.department_id]
    depts: dict[Any, Department] = {}
    if dept_ids[0]:
        res = await db.execute(select(Department).where(Department.id.in_([d for d in dept_ids if d])))
        for d in res.scalars().all():
            depts[d.id] = d

    dept_a = depts.get(permit_a.department_id)
    dept_b = depts.get(permit_b.department_id)

    def est_cost(p: Permit) -> float:
        area = float(p.estimated_area_sqm or 0.0)
        depth = float(p.estimated_depth_meters or 1.0)
        return round(area * depth * 1200.0, 2)  # simple proxy

    prompt = NEGOTIATION_PROMPT.format(
        dept_a_name=(dept_a.name if dept_a else "Department A"),
        dept_a_type=(dept_a.type if dept_a else "municipal"),
        work_a=permit_a.work_type,
        start_a=str(permit_a.proposed_start_date),
        end_a=str(permit_a.proposed_end_date),
        cost_a=est_cost(permit_a),
        overlap_sqm=float(clash.overlap_area_sqm or 0.0),
        dept_b_name=(dept_b.name if dept_b else "Department B"),
        dept_b_type=(dept_b.type if dept_b else "municipal"),
        work_b=permit_b.work_type,
        start_b=str(permit_b.proposed_start_date),
        end_b=str(permit_b.proposed_end_date),
        cost_b=est_cost(permit_b),
        road_name=permit_a.road_name,
        ward=permit_a.ward,
        city=permit_a.city,
    )

    res = await groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1200,
    )
    content = (res.choices[0].message.content or "").strip()
    negotiation = json.loads(content)

    clash_details = {
        "reference_number": f"CLASH-{str(clash.id)[:8]}",
        "road_name": permit_a.road_name,
        "ward": permit_a.ward,
        "city": permit_a.city,
        "department_a": dept_a.name if dept_a else "Department A",
        "department_b": dept_b.name if dept_b else "Department B",
        "mou_blockchain_hash": clash.mou_blockchain_hash,
    }
    pdf_bytes = generate_mou_pdf(negotiation, clash_details)

    clash.status = "negotiating"
    clash.mou_pdf_url = f"inline:pdf;base64"  # frontend can accept bytes from response; URL can be replaced later

    duration_ms = int((time.time() - t0) * 1000)
    return {
        "clash_id": str(clash.id),
        "negotiation_result": negotiation,
        "mou_pdf_bytes_base64": _b64(pdf_bytes),
        "updated_at": datetime.utcnow().isoformat(),
        "duration_ms": duration_ms,
    }


def _b64(data: bytes) -> str:
    import base64

    return base64.b64encode(data).decode("ascii")

