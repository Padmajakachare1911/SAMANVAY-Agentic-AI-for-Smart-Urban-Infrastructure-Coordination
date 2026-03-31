from __future__ import annotations

import json
import os
from typing import Any

from groq import AsyncGroq


COMPLAINT_CLASSIFICATION_PROMPT = """
You are a smart complaint classifier for SAMANVAY, an urban infrastructure platform in India.

Citizen complaint (may be in English or Hinglish):
"{complaint_text}"

Classify this complaint. Respond ONLY with valid JSON (no markdown, no explanation):
{{
  "category": "one of: road_not_restored | safety_barrier_missing | wrong_location | work_abandoned | dust_noise | water_disruption | other",
  "priority": "one of: low | medium | high | critical",
  "department_to_assign": "one of: water | gas | telecom | electricity | municipal",
  "summary_english": "one clear sentence summary in English",
  "sentiment": "one of: angry | frustrated | concerned | neutral",
  "requires_site_inspection": true or false,
  "estimated_resolution_days": integer between 1 and 30
}}
""".strip()


_groq_client: AsyncGroq | None = None


def _client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client


async def classify(complaint_text: str) -> dict[str, Any]:
    prompt = COMPLAINT_CLASSIFICATION_PROMPT.format(complaint_text=complaint_text)
    res = await _client().chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=600,
    )
    content = (res.choices[0].message.content or "").strip()
    return json.loads(content)

