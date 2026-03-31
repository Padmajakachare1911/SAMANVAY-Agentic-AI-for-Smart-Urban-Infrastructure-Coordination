import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_mou_pdf(negotiation_result: dict[str, Any], clash_details: dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    body_style = styles["BodyText"]
    small_style = ParagraphStyle("small", parent=body_style, fontSize=9, leading=12)

    elements: list[Any] = []

    elements.append(Paragraph("SAMANVAY — Joint Dig Memorandum of Understanding (MoU)", title_style))
    elements.append(Spacer(1, 0.3 * cm))

    ref = clash_details.get("reference_number") or f"MOU-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    elements.append(Paragraph(f"<b>Reference:</b> {ref}", body_style))
    elements.append(Paragraph(f"<b>Date:</b> {datetime.utcnow().strftime('%Y-%m-%d')}", body_style))
    elements.append(Spacer(1, 0.25 * cm))

    road = clash_details.get("road_name", "")
    ward = clash_details.get("ward", "")
    city = clash_details.get("city", "")
    elements.append(Paragraph(f"<b>Road:</b> {road} | <b>Ward:</b> {ward} | <b>City:</b> {city}", body_style))
    elements.append(Spacer(1, 0.25 * cm))

    dept_a = clash_details.get("department_a", "Department A")
    dept_b = clash_details.get("department_b", "Department B")
    elements.append(Paragraph(f"<b>Parties:</b> {dept_a} and {dept_b}", body_style))
    elements.append(Spacer(1, 0.3 * cm))

    schedule_table = Table(
        [
            ["Joint Start Date", negotiation_result.get("joint_start_date", "")],
            ["Joint End Date", negotiation_result.get("joint_end_date", "")],
            ["Lead Department", negotiation_result.get("lead_department", "")],
            ["Total Road Closure Days", str(negotiation_result.get("total_road_closure_days", ""))],
        ],
        colWidths=[6 * cm, 11 * cm],
    )
    schedule_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(Paragraph("<b>Joint Schedule</b>", body_style))
    elements.append(Spacer(1, 0.15 * cm))
    elements.append(schedule_table)
    elements.append(Spacer(1, 0.35 * cm))

    cost_split = negotiation_result.get("cost_split") or {}
    cost_rows = [["Department", "Share"]] + [[k, v] for k, v in cost_split.items()]
    cost_table = Table(cost_rows, colWidths=[9 * cm, 8 * cm])
    cost_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(Paragraph("<b>Cost Split</b>", body_style))
    elements.append(Spacer(1, 0.15 * cm))
    elements.append(cost_table)
    elements.append(Spacer(1, 0.35 * cm))

    elements.append(Paragraph("<b>Coordination Plan</b>", body_style))
    elements.append(Spacer(1, 0.15 * cm))
    elements.append(Paragraph(str(negotiation_result.get("coordination_plan", "")), body_style))
    elements.append(Spacer(1, 0.35 * cm))

    clauses = negotiation_result.get("mou_clauses") or []
    elements.append(Paragraph("<b>MoU Clauses</b>", body_style))
    elements.append(Spacer(1, 0.15 * cm))
    for i, c in enumerate(clauses[:5], start=1):
        elements.append(Paragraph(f"{i}. {c}", body_style))
        elements.append(Spacer(1, 0.05 * cm))

    elements.append(Spacer(1, 0.45 * cm))

    sig_table = Table(
        [
            ["Department Head (A) Signature", "Department Head (B) Signature"],
            ["______________________________", "______________________________"],
        ],
        colWidths=[8.5 * cm, 8.5 * cm],
    )
    sig_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(sig_table)
    elements.append(Spacer(1, 0.35 * cm))

    blockchain_hash = clash_details.get("mou_blockchain_hash") or "TBD"
    elements.append(Paragraph(f"<b>Blockchain Hash:</b> {blockchain_hash}", small_style))

    doc.build(elements)
    return buffer.getvalue()

