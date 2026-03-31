import { useState, useEffect, useRef, useCallback } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const DEPT_COLORS = {
  water: { bg: "#3B82F6", light: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" },
  gas: { bg: "#F97316", light: "#FED7AA", text: "#C2410C", border: "#FDBA74" },
  telecom: { bg: "#8B5CF6", light: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" },
  electricity: { bg: "#EAB308", light: "#FEF9C3", text: "#A16207", border: "#FDE047" },
  municipal: { bg: "#6B7280", light: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
};
const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  approved: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  active: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  completed: { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  clashed: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};
let MOCK_STATS = { total_permits: 30, active_permits: 8, clashes_detected: 4, clashes_resolved: 2, total_complaints: 42, open_complaints: 18, contractors_blacklisted: 1, wards_covered: 6, citizen_reports_this_month: 127, crores_saved_estimate: 3.4 };
let MOCK_PERMITS = [
  { id: "per-001", permit_number: "NMMC-WATER-2025-001", department_id: "dep-001", department_name: "Navi Mumbai Water Dept", department_type: "water", contractor_name: "Shree Infrastructure Pvt Ltd", road_name: "Sector 15 Road A, Vashi", ward: "Ward A", work_type: "Water main pipe replacement 300mm dia", proposed_start_date: "2025-08-01", proposed_end_date: "2025-08-18", estimated_depth_meters: 2.5, estimated_area_sqm: 85.0, status: "clashed", clash_detected: true, ai_risk_score: 0.82, blockchain_tx_hash: "0xabc123def456" },
  { id: "per-002", permit_number: "NMMC-GAS-2025-007", department_id: "dep-002", department_name: "Maharashtra Gas Authority", department_type: "gas", contractor_name: "BuildRight Constructions", road_name: "Sector 15 Road A, Vashi", ward: "Ward A", work_type: "Gas pipeline maintenance 150mm", proposed_start_date: "2025-08-10", proposed_end_date: "2025-08-25", estimated_depth_meters: 1.8, estimated_area_sqm: 60.0, status: "clashed", clash_detected: true, ai_risk_score: 0.78, blockchain_tx_hash: "0xdef789abc012" },
  { id: "per-003", permit_number: "NMMC-TELE-2025-015", department_id: "dep-003", department_name: "Reliance Jio Telecom", department_type: "telecom", contractor_name: "DigiNet Services", road_name: "Palm Beach Road, Sector 22", ward: "Ward C", work_type: "Fiber optic cable laying underground", proposed_start_date: "2025-09-01", proposed_end_date: "2025-09-20", estimated_depth_meters: 1.2, estimated_area_sqm: 120.0, status: "approved", clash_detected: false, ai_risk_score: 0.34, blockchain_tx_hash: "0x111aaa222bbb" },
  { id: "per-004", permit_number: "NMMC-WATER-2025-022", department_id: "dep-001", department_name: "Navi Mumbai Water Dept", department_type: "water", contractor_name: "Apex Civil Works", road_name: "Turbhe Station Road", ward: "Ward B", work_type: "Sewer line repair and manhole cover replacement", proposed_start_date: "2025-09-05", proposed_end_date: "2025-09-15", estimated_depth_meters: 3.0, estimated_area_sqm: 45.0, status: "active", clash_detected: false, ai_risk_score: 0.55, blockchain_tx_hash: "0x333ccc444ddd" },
  { id: "per-005", permit_number: "NMMC-ELEC-2025-008", department_id: "dep-004", department_name: "MSEDCL Electricity", department_type: "electricity", contractor_name: "PowerGrid Solutions", road_name: "Nerul Link Road", ward: "Ward D", work_type: "Underground cable laying 11kV", proposed_start_date: "2025-10-01", proposed_end_date: "2025-10-22", estimated_depth_meters: 1.5, estimated_area_sqm: 95.0, status: "pending", clash_detected: false, ai_risk_score: 0.42, blockchain_tx_hash: null },
];
let MOCK_CONTRACTORS = [
  { id: "con-001", name: "Shree Infrastructure Pvt Ltd", registration_number: "NMMC-CONT-001", performance_score: 92.5, total_projects: 47, completed_on_time: 41, penalty_count: 2, penalty_amount_inr: 45000, digilocker_verified: true, is_blacklisted: false, badge: "excellent" },
  { id: "con-002", name: "Apex Civil Works", registration_number: "NMMC-CONT-002", performance_score: 78.0, total_projects: 23, completed_on_time: 18, penalty_count: 5, penalty_amount_inr: 120000, digilocker_verified: true, is_blacklisted: false, badge: "good" },
  { id: "con-003", name: "BuildRight Constructions", registration_number: "NMMC-CONT-003", performance_score: 55.5, total_projects: 12, completed_on_time: 7, penalty_count: 8, penalty_amount_inr: 230000, digilocker_verified: false, is_blacklisted: false, badge: "average" },
  { id: "con-004", name: "PowerGrid Solutions", registration_number: "NMMC-CONT-004", performance_score: 88.0, total_projects: 34, completed_on_time: 30, penalty_count: 1, penalty_amount_inr: 15000, digilocker_verified: true, is_blacklisted: false, badge: "excellent" },
  { id: "con-005", name: "DigiNet Services", registration_number: "NMMC-CONT-005", performance_score: 25.0, total_projects: 8, completed_on_time: 2, penalty_count: 15, penalty_amount_inr: 450000, digilocker_verified: false, is_blacklisted: true, badge: "poor" },
];
let MOCK_COMPLAINTS = [
  { id: "comp-001", raw_text: "Sector 15 road khodi gayi 3 hafte pehle, abhi tak restore nahi hua. Bohot problem hai driving mein.", category: "road_not_restored", priority: "high", sentiment: "angry", status: "open", department_assigned: "municipal", ai_summary: "Road not restored 3 weeks after digging in Sector 15. Significant traffic disruption reported.", ward: "Ward A", created_at: "2025-07-28T10:30:00Z", citizen_points_awarded: 10 },
  { id: "comp-002", raw_text: "No safety barrier at the dig site near Vashi station. Very dangerous for pedestrians walking at night.", category: "safety_barrier_missing", priority: "critical", sentiment: "concerned", status: "assigned", department_assigned: "municipal", ai_summary: "Missing safety barriers at Vashi station dig site creating hazard for pedestrians at night.", ward: "Ward A", created_at: "2025-07-30T14:15:00Z", citizen_points_awarded: 15 },
  { id: "comp-003", raw_text: "Galat jagah khod rahe hain! Permit mein sector 17 hai but yeh sector 19 mein kaam kar rahe hain.", category: "wrong_location", priority: "high", sentiment: "angry", status: "in_progress", department_assigned: "water", ai_summary: "Contractor digging at wrong location — Sector 19 instead of permitted Sector 17.", ward: "Ward C", created_at: "2025-08-01T09:00:00Z", citizen_points_awarded: 20 },
  { id: "comp-004", raw_text: "Construction dust entering homes near Turbhe road dig. Asthma patients suffering. Please stop immediately.", category: "dust_noise", priority: "critical", sentiment: "angry", status: "open", department_assigned: "municipal", ai_summary: "Excessive construction dust from Turbhe road dig causing health issues for asthma patients.", ward: "Ward B", created_at: "2025-08-02T16:45:00Z", citizen_points_awarded: 0 },
];
let MOCK_PREDICTIONS = [
  { road_name: "Sector 15 Road A, Vashi", ward: "Ward A", predicted_dig_probability_90d: 0.87, age_years: 18, dig_count_5yr: 9, surface_condition_score: 3.2, risk_level: "critical" },
  { road_name: "Turbhe Station Road", ward: "Ward B", predicted_dig_probability_90d: 0.74, age_years: 12, dig_count_5yr: 6, surface_condition_score: 4.5, risk_level: "high" },
  { road_name: "Nerul Link Road", ward: "Ward D", predicted_dig_probability_90d: 0.68, age_years: 9, dig_count_5yr: 5, surface_condition_score: 5.1, risk_level: "high" },
  { road_name: "Palm Beach Road, Sector 22", ward: "Ward C", predicted_dig_probability_90d: 0.41, age_years: 6, dig_count_5yr: 3, surface_condition_score: 6.8, risk_level: "medium" },
  { road_name: "Sanpada Station Road", ward: "Ward E", predicted_dig_probability_90d: 0.22, age_years: 4, dig_count_5yr: 1, surface_condition_score: 8.2, risk_level: "low" },
];
let AGENT_LOGS = [
  { agent: "Clash Agent", color: "#EF4444", msg: "Detected clash between NMMC-WATER-001 and NMMC-GAS-007 — HIGH severity", time: "2 min ago" },
  { agent: "Negotiation Agent", color: "#8B5CF6", msg: "Generated MoU for Clash #001 — Joint schedule saved 11 citizen-days", time: "1 min ago" },
  { agent: "Complaint Agent", color: "#F97316", msg: "Classified complaint #comp-002 as CRITICAL safety violation — Auto-assigned to Municipal", time: "4 min ago" },
  { agent: "ML Predictor", color: "#10B981", msg: "Updated road health scores for 12 roads in Ward A — 3 roads flagged HIGH RISK", time: "10 min ago" },
  { agent: "Clash Agent", color: "#EF4444", msg: "No clashes found for new permit NMMC-TELE-2025-015 — Approved automatically", time: "15 min ago" },
];
const MOU_RESULT = {
  joint_start_date: "2025-08-01", joint_end_date: "2025-08-22",
  lead_department: "Navi Mumbai Water Dept",
  coordination_plan: "Water dept will complete deeper excavation (2.5m) first from Aug 1-12. Gas dept will then lay pipeline in the same open trench from Aug 13-22, saving re-excavation. Both depts share road restoration cost equally.",
  cost_split: { "Water Dept": 55, "Gas Authority": 45 },
  citizen_impact_days_saved: 11,
  mou_clauses: [
    "Water Department shall lead excavation commencing August 1, 2025",
    "Gas Authority shall commence pipeline laying no later than August 13, 2025",
    "Road restoration shall be jointly funded — Water 55%, Gas 45%",
    "Both departments shall provide joint safety barriers for full duration",
    "Any delay by either party incurs penalty of ₹5,000 per day to NMMC",
  ],
};
const BLOCKCHAIN_RECORDS = [
  { block: "4521893", time: "Aug 01 2025 09:12:33", status: "SUBMITTED", detail: "Dept: Navi Mumbai Water Dept | Road: Sector 15 Road A, Vashi", tx: "0xabc123def456abc123def456abc123def456abc1" },
  { block: "4521901", time: "Aug 01 2025 09:45:17", status: "APPROVED", detail: "Approved by: officer@nmmc.gov.in", tx: "0xdef789abc012def789abc012def789abc012def7" },
  { block: "4521988", time: "Aug 01 2025 14:22:05", status: "CLASHED", detail: "Clash with NMMC-GAS-2025-007 detected — Overlap: 28.5 sqm", tx: "0x111aaa222bbb111aaa222bbb111aaa222bbb111a" },
  { block: "4522105", time: "Aug 02 2025 10:11:44", status: "NEGOTIATION_COMPLETE", detail: "MoU signed by both departments — Joint plan approved", tx: "0x222bbb333ccc222bbb333ccc222bbb333ccc222b" },
];

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({ children, color = "#3B82F6", bg = "#DBEAFE" }) => (
  <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
);
const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block", animation: status === "clashed" ? "pulse 1.5s infinite" : "none" }} />
    {status.toUpperCase()}
  </span>;
};
const RiskBadge = ({ level }) => {
  const colors = { critical: ["#FEE2E2", "#991B1B"], high: ["#FEF3C7", "#92400E"], medium: ["#FEF9C3", "#854D0E"], low: ["#D1FAE5", "#065F46"] };
  const [bg, text] = colors[level] || colors.medium;
  return <Badge color={text} bg={bg}>{level}</Badge>;
};
const ScoreGauge = ({ score, size = 64 }) => {
  const r = (size - 10) / 2; const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 81 ? "#10B981" : score >= 61 ? "#3B82F6" : score >= 41 ? "#F97316" : "#EF4444";
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${filled} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
    <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fontSize={size > 80 ? 18 : 12} fontWeight="bold" fill={color}>{Math.round(score)}</text>
  </svg>;
};
const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>{children}</div>
);
const StatCard = ({ icon, label, value, color = "#3B82F6", bg = "#EFF6FF", sub }) => (
  <Card style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
    <div style={{ background: bg, color, borderRadius: 10, padding: 12, fontSize: 22, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);
const Btn = ({ children, onClick, variant = "primary", size = "md", style = {} }) => {
  const styles = {
    primary: { background: "#2563EB", color: "#fff", border: "none" },
    danger: { background: "#DC2626", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#374151", border: "1px solid #D1D5DB" },
    purple: { background: "#7C3AED", color: "#fff", border: "none" },
    success: { background: "#059669", color: "#fff", border: "none" },
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 18px", fontSize: 14 }, lg: { padding: "12px 28px", fontSize: 15 } };
  return <button onClick={onClick} style={{ borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity 0.15s", ...styles[variant], ...sizes[size], ...style }} onMouseEnter={e => e.target.style.opacity = "0.85"} onMouseLeave={e => e.target.style.opacity = "1"}>{children}</button>;
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value));
  return <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, padding: "0 4px" }}>
    {data.map((d, i) => (
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 700 }}>{d.value}</span>
        <div style={{ width: "100%", height: (d.value / max) * 90, background: d.color || "#3B82F6", borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height 0.6s ease" }} />
        <span style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center", lineHeight: 1.2 }}>{d.label}</span>
      </div>
    ))}
  </div>;
};
const HBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value));
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {data.map((d, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 150, fontSize: 12, color: "#374151", textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
        <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 22, position: "relative" }}>
          <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: d.color || "#3B82F6", borderRadius: 4, transition: "width 0.8s ease", display: "flex", alignItems: "center", paddingLeft: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{Math.round(d.value * 100)}%</span>
          </div>
        </div>
      </div>
    ))}
  </div>;
};
const PieChart = ({ data }) => {
  let start = 0;
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices = data.map(d => { const angle = (d.value / total) * 360; const s = { ...d, start, angle }; start += angle; return s; });
  const polarToXY = (angle, r) => ({ x: 50 + r * Math.cos((angle - 90) * Math.PI / 180), y: 50 + r * Math.sin((angle - 90) * Math.PI / 180) });
  return <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
    <svg width={100} height={100} viewBox="0 0 100 100">
      {slices.map((s, i) => {
        const p1 = polarToXY(s.start, 38); const p2 = polarToXY(s.start + s.angle, 38);
        const large = s.angle > 180 ? 1 : 0;
        return <path key={i} d={`M 50 50 L ${p1.x} ${p1.y} A 38 38 0 ${large} 1 ${p2.x} ${p2.y} Z`} fill={s.color} />;
      })}
      <circle cx={50} cy={50} r={22} fill="#fff" />
      <text x={50} y={50} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="bold" fill="#374151">Cost</text>
    </svg>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#374151" }}>{d.label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginLeft: "auto" }}>{d.value}%</span>
      </div>)}
    </div>
  </div>;
};

// ─── MAP COMPONENT (SVG-based since Leaflet not available in artifact) ─────────
const MapView = ({ permits, onPermitClick }) => {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  // Navi Mumbai map — simplified SVG representation
  const safePermits = Array.isArray(permits) ? permits : [];
  const permitsWithPos = [
    { idx: 0, x: 180, y: 155, w: 48, h: 38 },
    { idx: 1, x: 190, y: 163, w: 38, h: 32 },
    { idx: 2, x: 320, y: 210, w: 55, h: 30 },
    { idx: 3, x: 420, y: 130, w: 44, h: 36 },
    { idx: 4, x: 490, y: 280, w: 46, h: 40 },
  ]
    .map(({ idx, ...pos }) => {
      const p = safePermits[idx];
      if (!p) return null;
      return { ...p, ...pos };
    })
    .filter(Boolean);
  const roads = [
    "M 80 100 Q 200 80 350 100 Q 450 115 580 110",
    "M 100 160 Q 250 155 400 165 Q 500 170 600 160",
    "M 120 220 Q 280 210 420 225 Q 520 230 600 220",
    "M 150 280 Q 300 270 450 285 Q 550 290 620 280",
    "M 200 80 Q 205 160 210 240 Q 215 320 220 380",
    "M 350 90 Q 355 170 360 250 Q 365 330 370 390",
    "M 500 100 Q 502 180 504 260 Q 506 340 508 400",
  ];
  return <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
    <svg width="100%" viewBox="0 0 680 420" style={{ background: "#f0f4f0", display: "block" }}>
      {/* Water bodies */}
      <rect x={580} y={0} width={100} height={420} fill="#bdd5ea" opacity={0.5} />
      <ellipse cx={620} cy={200} rx={60} ry={180} fill="#93c5d4" opacity={0.4} />
      {/* City blocks */}
      {[...Array(12)].map((_, i) => <rect key={i} x={80 + (i % 6) * 80} y={90 + Math.floor(i / 6) * 130} width={60} height={110} rx={4} fill="#e8edd4" stroke="#c8d0b0" strokeWidth={0.5} />)}
      {/* Roads */}
      {roads.map((d, i) => <path key={i} d={d} fill="none" stroke="#d4c9a8" strokeWidth={i < 4 ? 10 : 8} />)}
      {roads.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke="#f5f0e0" strokeWidth={i < 4 ? 6 : 4} strokeDasharray={i >= 4 ? "0" : "0"} />)}
      {/* Ward labels */}
      {["Ward A", "Ward B", "Ward C", "Ward D", "Ward E"].map((w, i) => <text key={w} x={100 + i * 90} y={75} fontSize={10} fill="#9CA3AF" fontWeight={600}>{w}</text>)}
      {/* Permits */}
      {permitsWithPos.map(p => {
        const deptType = p.department_type || "municipal";
        const dc = DEPT_COLORS[deptType] || DEPT_COLORS.municipal;
        const isClashed = p.clash_detected;
        const isHov = hovered === p.id;
        return <g key={p.id} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} onClick={() => { setSelected(selected === p.id ? null : p.id); onPermitClick && onPermitClick(p); }} style={{ cursor: "pointer" }}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={4} fill={dc.bg} opacity={isHov ? 0.75 : 0.5} stroke={isClashed ? "#EF4444" : dc.border} strokeWidth={isClashed ? 2.5 : 1.5} strokeDasharray={isClashed ? "4 2" : "0"} />
          {selected === p.id && <rect x={p.x - 2} y={p.y - 2} width={p.w + 4} height={p.h + 4} rx={5} fill="none" stroke={dc.bg} strokeWidth={2.5} />}
          <text x={p.x + p.w / 2} y={p.y + p.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill={dc.text} fontWeight={700}>{deptType.substring(0, 4).toUpperCase()}</text>
          {isClashed && <text x={p.x + p.w / 2} y={p.y - 6} textAnchor="middle" fontSize={7} fill="#EF4444" fontWeight={800}>CLASH</text>}
        </g>;
      })}
      {/* Clash overlap */}
      <rect x={185} y={160} width={33} height={28} rx={3} fill="#EF4444" opacity={0.25} stroke="#EF4444" strokeWidth={1.5} />
      <text x={201} y={176} textAnchor="middle" fontSize={7} fill="#EF4444" fontWeight={800}>⚠</text>
      {/* Legend */}
      {[["water","Water"],["gas","Gas"],["telecom","Telecom"],["electricity","Elec"]].map(([type, label], i) => {
        const c = DEPT_COLORS[type];
        return <g key={type}>
          <rect x={10 + i * 70} y={395} width={10} height={10} rx={2} fill={c.bg} />
          <text x={24 + i * 70} y={404} fontSize={9} fill="#6B7280">{label}</text>
        </g>;
      })}
      <rect x={290} y={395} width={10} height={10} rx={2} fill="#EF4444" />
      <text x={304} y={404} fontSize={9} fill="#6B7280">Clashed</text>
      {/* Compass */}
      <text x={650} y={30} fontSize={14} fill="#9CA3AF">N↑</text>
      <text x={630} y={50} fontSize={9} fill="#9CA3AF">Navi Mumbai</text>
    </svg>
    {/* Tooltip */}
    {hovered && (() => {
      const p = permitsWithPos.find(x => x.id === hovered);
      if (!p) return null;
      return <div style={{ position: "absolute", top: p.y - 60, left: Math.min(p.x, 480), background: "#1F2937", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, pointerEvents: "none", zIndex: 10, minWidth: 180 }}>
        <div style={{ fontWeight: 700 }}>{p.permit_number}</div>
        <div style={{ color: "#9CA3AF", marginTop: 2 }}>{(p.work_type || "").substring(0, 40)}...</div>
        <StatusBadge status={p.status} />
      </div>;
    })()}
  </div>;
};

// ─── PAGES ────────────────────────────────────────────────────────────────────

// Dashboard
const DashboardPage = ({ navigate }) => {
  const [count, setCount] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState(0);
  useEffect(() => {
    const target = Number(MOCK_STATS?.total_permits || 0);
    setVisibleLogs(0);

    let v = 0;
    const t = setInterval(() => {
      v += 1;
      setCount(v);
      if (v >= target) clearInterval(t);
    }, 40);

    AGENT_LOGS.forEach((_, i) => setTimeout(() => setVisibleLogs(i + 1), 300 + i * 400));
    return () => clearInterval(t);
  }, [MOCK_STATS?.total_permits, AGENT_LOGS.length]);

  const deptData = [
    { label: "Water", type: "water" },
    { label: "Gas", type: "gas" },
    { label: "Telecom", type: "telecom" },
    { label: "Electric", type: "electricity" },
    { label: "Municipal", type: "municipal" },
  ].map(({ label, type }) => ({
    label,
    value: MOCK_PERMITS.filter((p) => p.department_type === type).length,
    color: (DEPT_COLORS[type] && DEPT_COLORS[type].bg) || "#3B82F6",
  }));
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Operations Dashboard</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Navi Mumbai Municipal Corporation — Real-time Infrastructure Coordination</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{ background: "#D1FAE5", color: "#065F46", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 1.5s infinite" }} /> AI Agents Active
        </span>
        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Aug 2, 2025</span>
      </div>
    </div>
    {/* Stat Cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <StatCard icon="📋" label="Total Permits" value={count} color="#2563EB" bg="#EFF6FF" sub={`${MOCK_STATS.active_permits} currently active`} />
      <StatCard icon="⚠️" label="Active Clashes" value={MOCK_STATS.clashes_detected} color="#DC2626" bg="#FEF2F2" sub="Requires attention" />
      <StatCard icon="💬" label="Open Complaints" value={MOCK_STATS.open_complaints} color="#C2410C" bg="#FFF7ED" sub="18 unresolved today" />
      <StatCard icon="💰" label="Est. Cost Savings" value={`₹${MOCK_STATS.crores_saved_estimate} Cr`} color="#059669" bg="#ECFDF5" sub="Through AI coordination" />
    </div>
    {/* Charts Row */}
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>Permits by Department</h3>
        <BarChart data={deptData} />
      </Card>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>Active Clashes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => navigate("clash-detail")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>Sector 15 Road A</div>
              <RiskBadge level="high" />
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
              <Badge color="#1D4ED8" bg="#DBEAFE">Water</Badge>
              <Badge color="#C2410C" bg="#FED7AA">Gas</Badge>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>28.5 sqm overlap · 8 days · Ward A</div>
          </div>
        </div>
      </Card>
    </div>
    {/* Agent Feed */}
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>🤖 Live AI Agent Activity</h3>
        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>● STREAMING</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {AGENT_LOGS.slice(0, visibleLogs).map((log, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8, borderLeft: `3px solid ${log.color}`, animation: "fadeIn 0.4s ease", opacity: 1 }}>
            <span style={{ background: log.color + "20", color: log.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>{log.agent}</span>
            <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{log.msg}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{log.time}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>;
};

// Map Page
const MapPage = ({ navigate }) => {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_PERMITS : MOCK_PERMITS.filter(p => p.department_type === filter || p.status === filter);
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Live Trench Map</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Real-time permit polygons — Navi Mumbai</p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, color: "#374151" }}>
          <option value="all">All Departments</option>
          <option value="water">Water</option>
          <option value="gas">Gas</option>
          <option value="telecom">Telecom</option>
          <option value="electricity">Electricity</option>
        </select>
        <select style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, color: "#374151" }}>
          <option>All Statuses</option>
          <option>Clashed</option>
          <option>Active</option>
          <option>Approved</option>
        </select>
        <Btn size="sm" onClick={() => navigate("new-permit")}>+ New Permit</Btn>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr", gap: 16, transition: "all 0.3s" }}>
      <MapView permits={filtered} onPermitClick={p => setSelected(p)} />
      {selected && <Card style={{ position: "relative", animation: "fadeIn 0.3s ease" }}>
        <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9CA3AF" }}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: DEPT_COLORS[selected.department_type]?.bg || "#6B7280" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: DEPT_COLORS[selected.department_type]?.text || "#374151" }}>{selected.department_name}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{selected.permit_number}</div>
        <StatusBadge status={selected.status} />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[["🛣️ Road", selected.road_name], ["📍 Ward", selected.ward], ["⚒️ Work", selected.work_type], ["📅 Start", selected.proposed_start_date], ["📅 End", selected.proposed_end_date], ["👷 Contractor", selected.contractor_name]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ color: "#9CA3AF", width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ color: "#374151", fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
        {selected.clash_detected && <div style={{ marginTop: 12, padding: 10, background: "#FEF2F2", borderRadius: 8, border: "1px solid #FCA5A5" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>⚠️ Clash Detected</div>
          <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>AI negotiation required</div>
        </div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={() => navigate("permit-detail")} style={{ flex: 1, justifyContent: "center" }}>View Details</Btn>
          {selected.clash_detected && <Btn size="sm" variant="danger" onClick={() => navigate("clash-detail")} style={{ flex: 1, justifyContent: "center" }}>Resolve Clash</Btn>}
        </div>
      </Card>}
    </div>
    {/* Permit list below map */}
    <Card>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>All Permits ({filtered.length})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(p => {
          const dc = DEPT_COLORS[p.department_type];
          return <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, cursor: "pointer", borderLeft: `3px solid ${dc?.bg || "#6B7280"}` }} onClick={() => setSelected(p)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.permit_number}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{p.road_name} · {p.ward}</div>
            </div>
            <StatusBadge status={p.status} />
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.proposed_start_date}</div>
          </div>;
        })}
      </div>
    </Card>
  </div>;
};

// Clash Detail
const ClashDetailPage = ({ navigate }) => {
  const [mouVisible, setMouVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=detected, 1=running, 2=done
  const runNegotiation = () => {
    setLoading(true); setStep(1);
    setTimeout(() => { setLoading(false); setMouVisible(true); setStep(2); }, 2500);
  };
  const steps = ["Clash Detected", "Negotiation Run", "MoU Generated", "Approved", "In Progress"];
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <button onClick={() => navigate("clashes")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, marginBottom: 4 }}>← Back to Clashes</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Clash #clash-001</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Sector 15 Road A, Vashi · Ward A</p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <RiskBadge level="high" />
        <Badge color="#991B1B" bg="#FEE2E2">28.5 sqm overlap</Badge>
        <Badge color="#92400E" bg="#FEF3C7">8 days conflict</Badge>
      </div>
    </div>
    {/* Status Timeline */}
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((s, i) => {
          const done = i <= step; const active = i === step;
          return <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#2563EB" : "#E5E7EB", color: done ? "#fff" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, border: active ? "2px solid #93C5FD" : "none", flexShrink: 0 }}>{done ? "✓" : i + 1}</div>
              <span style={{ fontSize: 10, color: done ? "#2563EB" : "#9CA3AF", fontWeight: done ? 700 : 400, textAlign: "center", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done && i < step ? "#2563EB" : "#E5E7EB", margin: "0 4px", marginBottom: 16 }} />}
          </div>;
        })}
      </div>
    </Card>
    {/* Main layout */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Left: Permit cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[MOCK_PERMITS[0], MOCK_PERMITS[1]].map((p, i) => {
          const dc = DEPT_COLORS[p.department_type];
          return <Card key={p.id} style={{ borderLeft: `4px solid ${dc.bg}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: dc.text, textTransform: "uppercase", marginBottom: 4 }}>Permit {i + 1}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{p.permit_number}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {[["Dept", p.department_name], ["Work", p.work_type.substring(0, 35) + "..."], ["Dates", `${p.proposed_start_date} → ${p.proposed_end_date}`], ["Depth", `${p.estimated_depth_meters}m | ${p.estimated_area_sqm} sqm`], ["Contractor", p.contractor_name]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#9CA3AF", width: 70, flexShrink: 0 }}>{l}</span>
                  <span style={{ color: "#374151" }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>;
        })}
        {/* Mini map showing clash */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 12px 0", fontSize: 13, fontWeight: 700, color: "#374151" }}>Clash Zone</div>
          <svg width="100%" viewBox="0 0 300 160" style={{ background: "#f0f4f0", display: "block" }}>
            <rect x={60} y={40} width={90} height={70} rx={6} fill="#3B82F6" opacity={0.45} stroke="#3B82F6" strokeWidth={2} />
            <rect x={95} y={60} width={80} height={65} rx={6} fill="#F97316" opacity={0.45} stroke="#F97316" strokeWidth={2} />
            <rect x={95} y={60} width={55} height={50} rx={3} fill="#EF4444" opacity={0.35} stroke="#EF4444" strokeWidth={2} strokeDasharray="4 2" />
            <text x={72} y={90} fontSize={9} fill="#1D4ED8" fontWeight={700}>WATER</text>
            <text x={168} y={95} fontSize={9} fill="#C2410C" fontWeight={700}>GAS</text>
            <text x={120} y={88} fontSize={8} fill="#991B1B" fontWeight={800}>CLASH</text>
            <text x={120} y={99} fontSize={8} fill="#991B1B">28.5 sqm</text>
          </svg>
        </Card>
        {!mouVisible && <Btn onClick={runNegotiation} variant="purple" style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
          {loading ? "🤖 AI Negotiating..." : "🤖 Run AI Negotiation"}
        </Btn>}
        {loading && <div style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, marginBottom: 8 }}>Analyzing permits, generating joint schedule, drafting MoU clauses...</div>
          <div style={{ background: "#EDE9FE", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div style={{ background: "#7C3AED", height: "100%", width: "60%", borderRadius: 8, animation: "loading 2s linear infinite" }} />
          </div>
        </div>}
      </div>
      {/* Right: MoU Result */}
      {mouVisible ? <Card style={{ border: "2px solid #8B5CF6" }}>
        <div style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>🤖 AI Negotiation Result</div>
          <div style={{ fontSize: 12, color: "#DDD6FE", marginTop: 2 }}>SAMANVAY Coordination Agent</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#F5F3FF", borderRadius: 8, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7C3AED" }}>Joint Period</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Aug 1 – Aug 22</div>
          </div>
          <div style={{ flex: 1, background: "#ECFDF5", borderRadius: 8, padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#059669" }}>Days Saved</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>11</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#374151", background: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 16, lineHeight: 1.6 }}>{MOU_RESULT.coordination_plan}</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Cost Split</div>
          <PieChart data={[{ label: "Water Dept", value: 55, color: "#3B82F6" }, { label: "Gas Authority", value: 45, color: "#F97316" }]} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>MoU Clauses</div>
          {MOU_RESULT.mou_clauses.map((clause, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 12, color: "#374151" }}>
              <span style={{ fontWeight: 800, color: "#7C3AED", flexShrink: 0 }}>{i + 1}.</span>
              <span>{clause}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn size="sm" variant="success" style={{ flex: 1, justifyContent: "center" }}>✓ Approve Joint Plan</Btn>
          <Btn size="sm" variant="ghost" style={{ flex: 1, justifyContent: "center" }}>⬇ Download MoU PDF</Btn>
        </div>
      </Card> : <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, color: "#9CA3AF", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>AI Negotiation Ready</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>Click "Run AI Negotiation" to generate a joint schedule and MoU for both departments</div>
      </Card>}
    </div>
  </div>;
};

// Complaints Kanban
const ComplaintsPage = () => {
  const columns = [
    { id: "open", label: "Open", color: "#EF4444", bg: "#FEF2F2", complaints: MOCK_COMPLAINTS.filter(c => c.status === "open") },
    { id: "assigned", label: "In Progress", color: "#2563EB", bg: "#EFF6FF", complaints: MOCK_COMPLAINTS.filter(c => c.status === "assigned" || c.status === "in_progress") },
    { id: "resolved", label: "Resolved", color: "#059669", bg: "#ECFDF5", complaints: [] },
  ];
  const priorityColors = { critical: ["#FEE2E2", "#991B1B"], high: ["#FEF3C7", "#92400E"], medium: ["#FEF9C3", "#854D0E"], low: ["#D1FAE5", "#065F46"] };
  const sentiment = { angry: "😠", concerned: "😟", frustrated: "😟", neutral: "😐" };
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Citizen Complaints</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>AI-classified and auto-assigned • {MOCK_COMPLAINTS.length} total</p>
      </div>
      <Btn size="sm">+ File Complaint</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {columns.map(col => (
        <div key={col.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ background: col.color, color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>{col.label}</div>
            <span style={{ background: col.bg, color: col.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{col.complaints.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {col.complaints.map(c => {
              const [pbg, ptxt] = priorityColors[c.priority] || priorityColors.medium;
              return <Card key={c.id} style={{ cursor: "pointer", transition: "box-shadow 0.2s" }} className="complaint-card">
                <div style={{ display: "flex", justify: "space-between", alignItems: "start", gap: 8, marginBottom: 8 }}>
                  <Badge color={ptxt} bg={pbg}>{c.priority}</Badge>
                  <span style={{ fontSize: 16 }}>{sentiment[c.sentiment] || "😐"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#374151", marginBottom: 8, lineHeight: 1.5 }}>{c.raw_text.substring(0, 80)}...</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge color="#6D28D9" bg="#EDE9FE">{c.category.replace(/_/g, " ")}</Badge>
                  <Badge color="#374151" bg="#F3F4F6">{c.ward}</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#9CA3AF" }}>
                  <span>→ {c.department_assigned}</span>
                  <span>+{c.citizen_points_awarded} pts</span>
                </div>
              </Card>;
            })}
            {col.complaints.length === 0 && <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>No complaints</div>}
          </div>
        </div>
      ))}
    </div>
  </div>;
};

// Predictions
const PredictionsPage = () => {
  const featureImportance = [
    { label: "Dig count (5yr)", value: 0.35, color: "#EF4444" },
    { label: "Road age", value: 0.20, color: "#F97316" },
    { label: "Pipe age (water)", value: 0.15, color: "#EAB308" },
    { label: "Surface condition", value: 0.15, color: "#3B82F6" },
    { label: "Rainfall pattern", value: 0.10, color: "#8B5CF6" },
    { label: "Traffic load", value: 0.05, color: "#6B7280" },
  ];
  const riskColor = { critical: "#EF4444", high: "#F97316", medium: "#EAB308", low: "#10B981" };
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Road Health Predictions</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>ML-powered 90-day dig probability forecast</p>
      </div>
      <Badge color="#7C3AED" bg="#EDE9FE">Model Accuracy: 78%</Badge>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <StatCard icon="🛣️" label="Roads Analyzed" value="12" color="#2563EB" bg="#EFF6FF" />
      <StatCard icon="🔴" label="Critical Risk" value={MOCK_PREDICTIONS.filter(p => p.risk_level === "critical").length} color="#DC2626" bg="#FEF2F2" />
      <StatCard icon="🟠" label="High Risk" value={MOCK_PREDICTIONS.filter(p => p.risk_level === "high").length} color="#C2410C" bg="#FFF7ED" />
      <StatCard icon="🤖" label="Model Version" value="v2.4" color="#059669" bg="#ECFDF5" sub="XGBoost ensemble" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>Predicted Dig Probability (next 90 days)</h3>
        <HBarChart data={MOCK_PREDICTIONS.map(p => ({ label: p.road_name.substring(0, 22), value: p.predicted_dig_probability_90d, color: riskColor[p.risk_level] }))} />
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK_PREDICTIONS.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#F9FAFB", borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.road_name}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>Age: {p.age_years}yr · Digs: {p.dig_count_5yr} · Surface: {p.surface_condition_score}/10</div>
              </div>
              <RiskBadge level={p.risk_level} />
              {p.risk_level === "critical" || p.risk_level === "high" ? <Btn size="sm">Schedule Dig</Btn> : <Badge color="#6B7280" bg="#F3F4F6">Monitor</Badge>}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 16px" }}>Feature Importance</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {featureImportance.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{Math.round(f.value * 100)}%</span>
              </div>
              <div style={{ background: "#F3F4F6", borderRadius: 4, height: 8 }}>
                <div style={{ width: `${f.value * 100}%`, height: "100%", background: f.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>;
};

// Contractors
const ContractorsPage = () => {
  const sorted = [...MOCK_CONTRACTORS].sort((a, b) => b.performance_score - a.performance_score);
  const medals = ["🥇", "🥈", "🥉"];
  const badgeColors = { excellent: ["#D1FAE5", "#065F46"], good: ["#DBEAFE", "#1E40AF"], average: ["#FEF9C3", "#854D0E"], poor: ["#FEE2E2", "#991B1B"] };
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Contractor Leaderboard</h1>
      <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Performance scores based on project completion, penalties, and compliance</p>
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Rank", "Contractor", "Score", "Projects", "On-Time", "Penalties", "Badge", "Status"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const [bbg, btxt] = badgeColors[c.badge] || badgeColors.average;
            return <tr key={c.id} style={{ background: c.is_blacklisted ? "#FEF2F2" : "#fff", opacity: c.is_blacklisted ? 0.85 : 1, borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "12px 16px", fontSize: 15 }}>{medals[i] || `#${i + 1}`}</td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", display: "flex", gap: 6, alignItems: "center" }}>
                  {c.registration_number}
                  {c.digilocker_verified && <span style={{ color: "#059669" }}>✓ DigiLocker</span>}
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}><ScoreGauge score={c.performance_score} size={52} /></td>
              <td style={{ padding: "12px 16px", fontSize: 13 }}>{c.total_projects}</td>
              <td style={{ padding: "12px 16px", fontSize: 13 }}>{c.completed_on_time} <span style={{ color: "#9CA3AF", fontSize: 11 }}>({Math.round(c.completed_on_time / c.total_projects * 100)}%)</span></td>
              <td style={{ padding: "12px 16px", fontSize: 13 }}>
                <span style={{ color: c.penalty_count > 5 ? "#DC2626" : "#374151" }}>{c.penalty_count}</span>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>₹{(c.penalty_amount_inr / 1000).toFixed(0)}K</div>
              </td>
              <td style={{ padding: "12px 16px" }}><Badge color={btxt} bg={bbg}>{c.badge}</Badge></td>
              <td style={{ padding: "12px 16px" }}>{c.is_blacklisted ? <Badge color="#991B1B" bg="#FEE2E2">🚫 Blacklisted</Badge> : <Badge color="#065F46" bg="#D1FAE5">Active</Badge>}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </Card>
  </div>;
};

// Citizen Portal
const CitizenPortalPage = ({ navigate }) => {
  const [tab, setTab] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", text: "", category: "", ward: "" });
  const tabs = ["🔍 Find Digs", "📝 File Complaint", "🗺️ Alt Routes", "🏅 Civic Points"];
  const handleSubmit = () => { if (form.text) { setSubmitted(true); } };
  return <div style={{ minHeight: "100vh", background: "#F0F9FF", fontFamily: "'Segoe UI', sans-serif" }}>
    {/* Header */}
    <div style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB, #3B82F6)", padding: "32px 40px 0", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 14px", fontSize: 18, fontWeight: 900, color: "#1D4ED8" }}>S</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>SAMANVAY</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Citizen Road Works Portal · Navi Mumbai</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <Btn size="sm" variant="ghost" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => navigate("dashboard")}>Officer Portal ↗</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, borderBottom: "none" }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); setSubmitted(false); }} style={{ padding: "10px 20px", background: tab === i ? "#fff" : "transparent", color: tab === i ? "#1D4ED8" : "rgba(255,255,255,0.8)", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", fontSize: 13, fontWeight: tab === i ? 700 : 500, transition: "all 0.2s" }}>{t}</button>
        ))}
      </div>
    </div>
    {/* Content */}
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      {tab === 0 && <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F", marginBottom: 16 }}>Active Digs Near You</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input placeholder="Enter area or pin code (e.g. Vashi, Sector 15)" style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid #93C5FD", fontSize: 13 }} />
          <Btn>Search</Btn>
        </div>
        <MapView permits={MOCK_PERMITS.slice(0, 3)} />
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_PERMITS.filter(p => p.status === "active" || p.status === "clashed").map(p => {
            const dc = DEPT_COLORS[p.department_type];
            return <div key={p.id} style={{ background: "#fff", borderRadius: 10, padding: 16, border: `1px solid ${dc.border}`, borderLeft: `4px solid ${dc.bg}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, color: "#1E3A5F", fontSize: 14 }}>{p.road_name}</div>
                <StatusBadge status={p.status} />
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{p.work_type} · {p.proposed_start_date} to {p.proposed_end_date}</div>
              <div style={{ fontSize: 12, color: dc.text, fontWeight: 600, marginTop: 4 }}>{p.department_name}</div>
            </div>;
          })}
        </div>
      </div>}
      {tab === 1 && <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F", marginBottom: 16 }}>File a Complaint</h2>
        {!submitted ? <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Your Name (optional)</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} placeholder="Anonymous" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Phone Number</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Describe your complaint *</label>
            <textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={4} maxLength={500} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} placeholder="Describe the issue in detail — road not restored, safety barrier missing, wrong location, dust/noise, etc." />
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>{form.text.length}/500</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}>
                <option value="">Select category</option>
                <option>Road not restored</option>
                <option>Safety barrier missing</option>
                <option>Wrong location</option>
                <option>Dust/Noise</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Ward</label>
              <select value={form.ward} onChange={e => setForm({...form, ward: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}>
                <option>Select ward</option>
                {["Ward A", "Ward B", "Ward C", "Ward D", "Ward E"].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <Btn onClick={handleSubmit} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>Submit Complaint</Btn>
        </div> : <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Complaint Analyzed by SAMANVAY AI</h3>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 20, textAlign: "left", display: "inline-block", minWidth: 360, marginTop: 8 }}>
            {[["Category", "Safety Barrier Missing"], ["Priority", "CRITICAL 🚨"], ["Assigned to", "Municipal Department"], ["Est. Resolution", "2–3 days"], ["Your Civic Points", "+15 🏅"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                <span style={{ color: "#9CA3AF", width: 120, flexShrink: 0 }}>{l}</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="ghost" size="sm" onClick={() => setSubmitted(false)}>File Another</Btn>
          </div>
        </div>}
      </div>}
      {tab === 2 && <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F", marginBottom: 8 }}>Alternative Routes</h2>
        <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 20 }}>Road closed due to dig? Find alternate paths.</p>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>From</label>
              <input defaultValue="Sector 15 Vashi" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>To</label>
              <input defaultValue="Vashi Station" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          <Btn style={{ marginBottom: 20 }}>Find Routes</Btn>
          {[["Route A — Via Sector 17", "+4 min", "#D1FAE5", "#065F46", "Recommended"], ["Route B — Via Palm Beach Rd", "+8 min", "#FEF9C3", "#854D0E", "Moderate"], ["Route C — Via Turbhe Road", "+15 min", "#FEE2E2", "#991B1B", "Congested"]].map(([name, time, bg, txt, tag]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: bg, borderRadius: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{name}</div>
                <Badge color={txt} bg="transparent">{tag}</Badge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: txt }}>{time}</div>
            </div>
          ))}
        </div>
      </div>}
      {tab === 3 && <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E3A5F", marginBottom: 8 }}>Earn Civic Points 🏅</h2>
        <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 20 }}>Report road issues and earn points. Top contributors get featured on the ward leaderboard.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Top Contributors — Ward A</h3>
            {[["Rahul P.", 247, "🥇"], ["Sneha M.", 198, "🥈"], ["Aditya K.", 156, "🥉"], ["Priya T.", 132, "4️⃣"], ["Vivek S.", 89, "5️⃣"]].map(([name, pts, medal]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 16 }}>{medal}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{pts} pts</span>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>How to Earn</h3>
            {[["📸 Upload road photo", "+5 pts"], ["🚧 Report safety issue", "+15 pts"], ["📍 Report wrong location", "+20 pts"], ["✅ Verify resolved issue", "+10 pts"]].map(([action, pts]) => (
              <div key={action} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                <span>{action}</span>
                <Badge color="#065F46" bg="#D1FAE5">{pts}</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>}
    </div>
  </div>;
};

// Blockchain Explorer
const BlockchainExplorerPage = ({ navigate }) => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const statusColors = { SUBMITTED: "#3B82F6", APPROVED: "#10B981", CLASHED: "#EF4444", NEGOTIATION_COMPLETE: "#8B5CF6" };
  const search = () => { if (query.trim()) setSearched(true); };
  return <div style={{ minHeight: "100vh", background: "#0F172A", color: "#E2E8F0", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 40 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", borderRadius: 16, padding: "12px 20px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "0.1em" }}>⛓ SAMANVAY</div>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", margin: "0 0 8px" }}>Permit Blockchain Explorer</h1>
        <p style={{ color: "#64748B", fontSize: 13 }}>Tamper-proof audit trail · Polygon Mumbai Testnet · All permits on-chain</p>
        <button onClick={() => navigate("dashboard")} style={{ marginTop: 12, background: "none", border: "1px solid #334155", color: "#94A3B8", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>← Officer Portal</button>
      </div>
      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Enter permit number (e.g. NMMC-WATER-2025-001) or TX hash" style={{ flex: 1, padding: "12px 16px", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 13, fontFamily: "inherit" }} />
        <button onClick={search} style={{ padding: "12px 24px", background: "#22C55E", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>VERIFY</button>
      </div>
      {/* Results */}
      {searched && <div>
        <div style={{ background: "#1E293B", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #334155" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#22C55E" }}>✓ NMMC-WATER-2025-001 Verified</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>4 blockchain records found · Polygon Mumbai Testnet · Contract: 0x7a3B...9e2D</div>
          </div>
          <div style={{ background: "#14532D", color: "#22C55E", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>VALID</div>
        </div>
        {/* Timeline */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 2, background: "#1E3A5F" }} />
          {BLOCKCHAIN_RECORDS.map((r, i) => {
            const sc = statusColors[r.status] || "#64748B";
            return <div key={i} style={{ position: "relative", paddingLeft: 56, marginBottom: 20 }}>
              <div style={{ position: "absolute", left: 12, top: 16, width: 18, height: 18, borderRadius: "50%", background: sc, border: "3px solid #0F172A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>⬡</div>
              <div style={{ background: "#1E293B", borderRadius: 10, padding: 16, border: `1px solid ${sc}30`, cursor: "pointer" }} onClick={() => setExpanded(expanded === i ? null : i)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "inline-block", background: sc + "25", color: sc, padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", marginBottom: 6 }}>{r.status}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{r.detail}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#475569" }}>Block #{r.block}</div>
                    <div style={{ fontSize: 11, color: "#334155" }}>{r.time}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>TX: {r.tx.substring(0, 28)}...</div>
                {expanded === i && <div style={{ marginTop: 12, background: "#0F172A", borderRadius: 6, padding: 12, fontSize: 10, color: "#22C55E", lineHeight: 1.8 }}>
                  {`{\n  "block": ${r.block},\n  "timestamp": "${r.time}",\n  "status": "${r.status}",\n  "tx_hash": "${r.tx}",\n  "permit": "NMMC-WATER-2025-001",\n  "department": "dep-001",\n  "network": "polygon-mumbai"\n}`}
                </div>}
              </div>
            </div>;
          })}
        </div>
      </div>}
      {!searched && <div style={{ textAlign: "center", color: "#334155", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⛓</div>
        <div style={{ fontSize: 14 }}>Enter a permit number or transaction hash to verify on-chain</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>Try: <span style={{ color: "#22C55E", cursor: "pointer" }} onClick={() => { setQuery("NMMC-WATER-2025-001"); setTimeout(() => setSearched(true), 100); }}>NMMC-WATER-2025-001</span></div>
      </div>}
    </div>
  </div>;
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "map", icon: "🗺", label: "Live Map", badge: "LIVE", badgeColor: "#10B981" },
  { id: "permits", icon: "📋", label: "Permits" },
  { id: "clashes", icon: "⚠️", label: "Clashes", badge: "4", badgeColor: "#EF4444" },
  { id: "contractors", icon: "👷", label: "Contractors" },
  { id: "complaints", icon: "💬", label: "Complaints", badge: "18", badgeColor: "#F97316" },
  { id: "predictions", icon: "📊", label: "Predictions" },
];
const Sidebar = ({ page, navigate }) => (
  <div style={{ width: 220, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0 }}>
    <div style={{ padding: "20px 16px 16px" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#1D4ED8", letterSpacing: "0.05em" }}>SAMANVAY</div>
      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Urban AI · Navi Mumbai</div>
    </div>
    <nav style={{ flex: 1, padding: "8px 8px" }}>
      {NAV.map(item => {
        const active = page === item.id;
        return <button key={item.id} onClick={() => navigate(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: active ? "#EFF6FF" : "transparent", color: active ? "#1D4ED8" : "#6B7280", cursor: "pointer", marginBottom: 2, textAlign: "left", borderLeft: active ? "3px solid #2563EB" : "3px solid transparent", transition: "all 0.15s" }}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</span>
          {item.badge && <span style={{ background: item.badgeColor, color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>{item.badge}</span>}
        </button>;
      })}
      <div style={{ borderTop: "1px solid #F3F4F6", margin: "8px 0", paddingTop: 8 }}>
        {[{ id: "citizen", icon: "👤", label: "Citizen Portal ↗" }, { id: "explorer", icon: "⛓", label: "Permit Explorer ↗" }].map(item => (
          <button key={item.id} onClick={() => navigate(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#6B7280", cursor: "pointer", marginBottom: 2, textAlign: "left", fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  </div>
);

// ─── PERMITS LIST PAGE ────────────────────────────────────────────────────────
const PermitsPage = ({ navigate }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Permits</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>{MOCK_PERMITS.length} total permits</p>
      </div>
      <Btn onClick={() => navigate("new-permit")}>+ New Permit</Btn>
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Permit #", "Department", "Road", "Work Type", "Dates", "Status", "Risk", ""].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_PERMITS.map(p => {
            const dc = DEPT_COLORS[p.department_type];
            return <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#111827" }}>{p.permit_number}</td>
              <td style={{ padding: "12px 16px" }}><Badge color={dc?.text || "#374151"} bg={dc?.light || "#F3F4F6"}>{p.department_name.split(" ").slice(-2).join(" ")}</Badge></td>
              <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151" }}>{p.road_name}</td>
              <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280" }}>{p.work_type.substring(0, 35)}...</td>
              <td style={{ padding: "12px 16px", fontSize: 11, color: "#6B7280" }}>{p.proposed_start_date}<br />{p.proposed_end_date}</td>
              <td style={{ padding: "12px 16px" }}><StatusBadge status={p.status} /></td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 32, height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                    <div style={{ width: `${p.ai_risk_score * 100}%`, height: "100%", background: p.ai_risk_score > 0.7 ? "#EF4444" : p.ai_risk_score > 0.5 ? "#F97316" : "#10B981", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{Math.round(p.ai_risk_score * 100)}%</span>
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}><Btn size="sm" variant="ghost" onClick={() => navigate("permit-detail")}>View</Btn></td>
            </tr>;
          })}
        </tbody>
      </table>
    </Card>
  </div>
);

// Permit Detail
const PermitDetailPage = ({ navigate }) => {
  const p = MOCK_PERMITS[0];
  const dc = DEPT_COLORS[p.department_type];
  const [uploading, setUploading] = useState(false);
  const [cvResult, setCvResult] = useState(null);
  const simulateUpload = () => {
    setUploading(true);
    setTimeout(() => { setUploading(false); setCvResult(true); }, 2000);
  };
  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <button onClick={() => navigate("permits")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, alignSelf: "flex-start" }}>← Back to Permits</button>
    <div style={{ borderLeft: `6px solid ${dc.bg}`, paddingLeft: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>{p.permit_number}</h1>
          <div style={{ fontSize: 13, color: dc.text, fontWeight: 600 }}>{p.department_name}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={p.status} />
          <Btn size="sm" variant="ghost">Approve</Btn>
          <Btn size="sm" variant="danger">Reject</Btn>
        </div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Permit Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Road Name", p.road_name], ["Ward", p.ward], ["City", "Navi Mumbai"], ["Work Type", p.work_type], ["Contractor", p.contractor_name], ["Start Date", p.proposed_start_date], ["End Date", p.proposed_end_date], ["Depth", `${p.estimated_depth_meters}m`], ["Area", `${p.estimated_area_sqm} sqm`], ["AI Risk", `${Math.round(p.ai_risk_score * 100)}%`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>{l}</span>
                <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        {/* Clash Alert */}
        <Card style={{ border: "2px solid #FCA5A5", background: "#FEF2F2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#991B1B" }}>⚠️ Clash Detected</div>
              <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>Clashes with NMMC-GAS-2025-007 on Sector 15 Road A. 28.5 sqm overlap, 8 days conflict.</div>
            </div>
            <Btn size="sm" variant="danger" onClick={() => navigate("clash-detail")}>Resolve →</Btn>
          </div>
        </Card>
        {/* CV Upload */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Site Compliance Photo Upload</h3>
          <div onClick={simulateUpload} style={{ border: "2px dashed #D1D5DB", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", background: "#F9FAFB" }}>
            {uploading ? <div style={{ color: "#2563EB" }}>🔍 Analyzing with Computer Vision...</div> : <div style={{ color: "#9CA3AF" }}>📷 Click or drag photo to upload<br /><span style={{ fontSize: 11 }}>JPG, PNG up to 10MB</span></div>}
          </div>
          {cvResult && <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Safety barrier present", 95, true], ["Correct location verified", 88, true], ["Trench dimensions OK", 91, true], ["Dust suppression", 62, false]].map(([label, score, pass]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: pass ? "#ECFDF5" : "#FFFBEB", borderRadius: 6 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{pass ? "✅" : "⚠️"} {label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pass ? "#059669" : "#D97706" }}>{score}/100</span>
              </div>
            ))}
            <div style={{ padding: "10px 12px", background: "#DBEAFE", borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#1D4ED8", textAlign: "center" }}>Overall Compliance: 84/100 — APPROVED TO PROCEED</div>
          </div>}
        </Card>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Mini map */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 12px 0", fontSize: 13, fontWeight: 700, color: "#374151" }}>Permit Location</div>
          <svg width="100%" viewBox="0 0 280 180" style={{ background: "#f0f4f0", display: "block" }}>
            <rect x={0} y={0} width={280} height={180} fill="#e8edd4" />
            <path d="M 40 90 Q 140 70 240 90" fill="none" stroke="#d4c9a8" strokeWidth={14} />
            <path d="M 40 90 Q 140 70 240 90" fill="none" stroke="#f5f0e0" strokeWidth={8} />
            <rect x={100} y={68} width={60} height={46} rx={4} fill="#3B82F6" opacity={0.55} stroke="#2563EB" strokeWidth={2} strokeDasharray="5 2" />
            <text x={130} y={93} textAnchor="middle" fontSize={8} fill="#1D4ED8" fontWeight={700}>WATER</text>
            <text x={130} y={103} textAnchor="middle" fontSize={7} fill="#3B82F6">{p.permit_number.substring(10)}</text>
          </svg>
        </Card>
        {/* Blockchain */}
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>⛓ Blockchain Record</h3>
          {p.blockchain_tx_hash ? <div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Transaction Hash</div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#2563EB", background: "#EFF6FF", padding: "6px 8px", borderRadius: 6, wordBreak: "break-all" }}>{p.blockchain_tx_hash}</div>
            <div style={{ marginTop: 8 }}><Btn size="sm" variant="ghost" style={{ fontSize: 11 }} onClick={() => navigate("explorer")}>View on Explorer ↗</Btn></div>
          </div> : <div style={{ fontSize: 12, color: "#9CA3AF" }}>Pending blockchain confirmation...</div>}
        </Card>
      </div>
    </div>
  </div>;
};

// New Permit
const NewPermitPage = ({ navigate }) => {
  const [form, setForm] = useState({ dept: "", road: "", work_type: "", start: "", end: "", depth: "", area: "", contractor: "" });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => { setSubmitted(true); setTimeout(() => navigate("permits"), 2000); };
  return <div style={{ maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>
    <button onClick={() => navigate("permits")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, alignSelf: "flex-start" }}>← Back</button>
    <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Submit New Permit</h1>
    {submitted ? <Card style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>Permit submitted!</div>
      <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}>AI clash detection running... Redirecting to permits list.</div>
    </Card> : <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[["Department", "dept", "select", ["Navi Mumbai Water Dept", "Maharashtra Gas Authority", "Reliance Jio Telecom", "MSEDCL Electricity", "NMMC Municipal"]], ["Road Name", "road", "text", null], ["Work Type", "work_type", "text", null], ["Start Date", "start", "date", null], ["End Date", "end", "date", null], ["Depth (meters)", "depth", "number", null], ["Area (sqm)", "area", "number", null], ["Contractor", "contractor", "select", MOCK_CONTRACTORS.map(c => c.name)]].map(([label, key, type, opts]) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
            {type === "select" ? <select value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13 }}>
              <option value="">Select...</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select> : <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }} />}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Draw Trench Area on Map</label>
        <div style={{ border: "1px dashed #D1D5DB", borderRadius: 8, padding: 12, background: "#F9FAFB" }}>
          <svg width="100%" viewBox="0 0 500 150" style={{ background: "#f0f4f0", borderRadius: 6, display: "block" }}>
            <rect x={0} y={0} width={500} height={150} fill="#e8edd4" />
            <path d="M 0 75 Q 250 55 500 75" fill="none" stroke="#d4c9a8" strokeWidth={12} />
            <path d="M 0 75 Q 250 55 500 75" fill="none" stroke="#f5f0e0" strokeWidth={7} />
            <rect x={200} y={55} width={100} height={40} rx={4} fill="#3B82F6" opacity={0.3} stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="5 3" />
            <text x={250} y={77} textAnchor="middle" fontSize={10} fill="#2563EB">Draw area here</text>
          </svg>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#9CA3AF" }}>Click and drag to draw the trench polygon</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Btn onClick={handleSubmit} style={{ flex: 1, justifyContent: "center" }}>Submit Permit → AI Clash Check</Btn>
        <Btn variant="ghost" onClick={() => navigate("permits")}>Cancel</Btn>
      </div>
    </Card>}
  </div>;
};

// Clashes List
const ClashesPage = ({ navigate }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>Active Clashes</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>AI-detected permit conflicts requiring resolution</p>
      </div>
      <Badge color="#991B1B" bg="#FEE2E2">4 active</Badge>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[{ id: "clash-001", road: "Sector 15 Road A, Vashi", severity: "high", status: "negotiating", permits: ["NMMC-WATER-2025-001", "NMMC-GAS-2025-007"], overlap: "28.5 sqm", days: 8, ward: "Ward A", mou: true },
        { id: "clash-002", road: "Turbhe Station Road", severity: "medium", status: "pending", permits: ["NMMC-WATER-2025-022", "NMMC-TELE-2025-019"], overlap: "15.2 sqm", days: 5, ward: "Ward B", mou: false }].map(c => (
        <Card key={c.id} style={{ cursor: "pointer", transition: "box-shadow 0.2s" }} onClick={() => navigate("clash-detail")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <RiskBadge level={c.severity} />
                <Badge color="#6B7280" bg="#F3F4F6">{c.status}</Badge>
                {c.mou && <Badge color="#7C3AED" bg="#EDE9FE">MoU Ready</Badge>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{c.road}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Ward: {c.ward} · Overlap: {c.overlap} · {c.days} days conflict</div>
            </div>
            <Btn size="sm" variant="ghost">View →</Btn>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {c.permits.map(p => <span key={p} style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" }}>{p}</span>)}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const navigate = (p) => setPage(p);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setLoading(false);
      return;
    }

    const apiGet = async (path) => {
      const res = await fetch(`${API_BASE_URL}/api/v1${path}`, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET ${path} failed: ${res.status} ${text}`);
      }
      return res.json();
    };

    const badgeForScore = (score) => {
      const s = Number(score || 0);
      if (s >= 81) return "excellent";
      if (s >= 61) return "good";
      if (s >= 41) return "average";
      return "poor";
    };

    const riskForProb = (prob) => {
      const p = Number(prob || 0);
      if (p > 0.7) return "critical";
      if (p > 0.5) return "high";
      if (p > 0.3) return "medium";
      return "low";
    };

    (async () => {
      try {
        setLoading(true);

        const [
          permits,
          contractors,
          complaints,
          roads,
          logs,
        ] = await Promise.all([
          apiGet("/permits"),
          apiGet("/contractors/leaderboard"),
          apiGet("/complaints"),
          apiGet("/predictions/roads"),
          apiGet("/agents/logs"),
        ]);

        const hasPermits = Array.isArray(permits) && permits.length > 0;
        const hasContractors = Array.isArray(contractors) && contractors.length > 0;
        const hasComplaints = Array.isArray(complaints) && complaints.length > 0;
        const hasRoads = Array.isArray(roads) && roads.length > 0;

        if (hasPermits) {
          MOCK_PERMITS = (permits || []).map((p) => ({
            id: p.id,
            permit_number: p.permit_number,
            department_id: p.department_id,
            department_name: p.department_name,
            department_type: p.department_type,
            contractor_name: p.contractor_name,
            road_name: p.road_name,
            ward: p.ward,
            work_type: p.work_type,
            proposed_start_date: p.proposed_start_date,
            proposed_end_date: p.proposed_end_date,
            estimated_depth_meters: p.estimated_depth_meters,
            estimated_area_sqm: p.estimated_area_sqm,
            status: p.status,
            clash_detected: !!p.clash_detected,
            ai_risk_score: p.ai_risk_score,
            blockchain_tx_hash: p.blockchain_tx_hash,
          }));
        }

        if (hasContractors) {
          MOCK_CONTRACTORS = (contractors || []).map((c) => {
            const score = Number(c.performance_score || 0);
            return {
              id: c.id,
              name: c.name,
              registration_number: c.registration_number,
              performance_score: score,
              total_projects: c.total_projects,
              completed_on_time: c.completed_on_time,
              penalty_count: c.penalty_count,
              penalty_amount_inr: c.penalty_amount_inr || 0,
              digilocker_verified: c.digilocker_verified,
              is_blacklisted: c.is_blacklisted,
              badge: badgeForScore(score),
            };
          });
        }

        if (hasComplaints) {
          MOCK_COMPLAINTS = (complaints || []).map((c) => ({
            id: c.id,
            raw_text: c.raw_text,
            category: c.category,
            priority: c.priority,
            sentiment: c.sentiment || "neutral",
            status: c.status,
            department_assigned: c.department_assigned || "municipal",
            ai_summary: c.ai_summary,
            ward: c.ward,
            created_at: c.created_at,
            citizen_points_awarded: c.citizen_points_awarded || 0,
          }));
        }

        if (hasRoads) {
          MOCK_PREDICTIONS = (roads || []).map((r) => {
            const prob = Number(r.predicted_dig_probability_90d || 0);
            return {
              id: r.id,
              road_name: r.road_name,
              ward: r.ward,
              predicted_dig_probability_90d: prob,
              age_years: 0,
              dig_count_5yr: 0,
              surface_condition_score: 0,
              risk_level: riskForProb(prob),
            };
          });
        }

        // Only recompute stats when we got at least permit data.
        if (hasPermits) {
          MOCK_STATS = {
            total_permits: MOCK_PERMITS.length,
            active_permits: MOCK_PERMITS.filter((p) => ["approved", "active", "clashed"].includes(p.status)).length,
            clashes_detected: MOCK_PERMITS.filter((p) => p.clash_detected).length,
            clashes_resolved: 0,
            total_complaints: MOCK_COMPLAINTS.length,
            open_complaints: MOCK_COMPLAINTS.filter((c) => ["open", "assigned", "in_progress"].includes(c.status)).length,
            contractors_blacklisted: MOCK_CONTRACTORS.filter((c) => c.is_blacklisted).length,
            wards_covered: new Set(MOCK_PERMITS.map((p) => p.ward).filter(Boolean)).size,
            citizen_reports_this_month: MOCK_COMPLAINTS.length,
            crores_saved_estimate: Number((MOCK_PERMITS.filter((p) => p.clash_detected).length * 0.1).toFixed(1)),
          };
        }

        const colorForAgent = (name) => {
          if (name?.toLowerCase().includes("clash")) return "#EF4444";
          if (name?.toLowerCase().includes("negotiation")) return "#8B5CF6";
          if (name?.toLowerCase().includes("complaint")) return "#F97316";
          return "#10B981";
        };

        if (Array.isArray(logs) && logs.length) {
          AGENT_LOGS = logs.slice(0, 5).map((l) => ({
            agent: l.agent_name || l.agent || "Agent",
            color: colorForAgent(l.agent_name || l.agent),
            msg: `Event: ${l.agent_name || l.agent} (${l.status || "completed"})`,
            time: "just now",
          }));
        }

        setDataVersion((v) => v + 1);
      } catch (e) {
        console.error("Failed to load live data from backend:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pages without sidebar
  if (page === "citizen") return <CitizenPortalPage navigate={navigate} />;
  if (page === "explorer") return <BlockchainExplorerPage navigate={navigate} />;

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <DashboardPage navigate={navigate} />;
      case "map": return <MapPage navigate={navigate} />;
      case "permits": return <PermitsPage navigate={navigate} />;
      case "permit-detail": return <PermitDetailPage navigate={navigate} />;
      case "new-permit": return <NewPermitPage navigate={navigate} />;
      case "clashes": return <ClashesPage navigate={navigate} />;
      case "clash-detail": return <ClashDetailPage navigate={navigate} />;
      case "contractors": return <ContractorsPage navigate={navigate} />;
      case "complaints": return <ComplaintsPage navigate={navigate} />;
      case "predictions": return <PredictionsPage navigate={navigate} />;
      default: return <DashboardPage navigate={navigate} />;
    }
  };

  return <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
    <style>{`
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes loading { 0% { width: 0%; } 100% { width: 100%; } }
      * { box-sizing: border-box; }
      button:hover { opacity: 0.88; }
    `}</style>
    <Sidebar page={page} navigate={navigate} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* TopBar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>
          NMMC · {["Dashboard","Live Map","Permits","Clashes","Contractors","Complaints","Predictions","Permit Detail","Clash Detail","New Permit","Clashes"].find((_,i) => ["dashboard","map","permits","clashes","contractors","complaints","predictions","permit-detail","clash-detail","new-permit","clashes"][i] === page) || "Dashboard"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "#ECFDF5", color: "#065F46", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse 2s infinite" }} />
            5 Agents Running
          </span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>S</div>
        </div>
      </div>
      {/* Page content */}
      <main style={{ flex: 1, overflow: "auto", padding: 24, animation: "fadeIn 0.25s ease" }}>
        {renderPage()}
      </main>
    </div>
  </div>;
}
