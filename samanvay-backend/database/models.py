import datetime as dt
import uuid

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    BIGINT,
    BOOLEAN,
    DATE,
    INTEGER,
    NUMERIC,
    TEXT,
    VARCHAR,
    ForeignKey,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(VARCHAR(100), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(VARCHAR(255))
    contact_phone: Mapped[str | None] = mapped_column(VARCHAR(20))
    officer_name: Mapped[str | None] = mapped_column(VARCHAR(100))
    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    permits: Mapped[list["Permit"]] = relationship(back_populates="department")

    def __repr__(self) -> str:
        return f"<Department id={self.id} name={self.name!r} type={self.type!r}>"


class Contractor(Base):
    __tablename__ = "contractors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    registration_number: Mapped[str] = mapped_column(VARCHAR(100), unique=True, nullable=False)
    contact_email: Mapped[str | None] = mapped_column(VARCHAR(255))
    contact_phone: Mapped[str | None] = mapped_column(VARCHAR(20))
    digilocker_verified: Mapped[bool] = mapped_column(BOOLEAN, default=False)
    performance_score: Mapped[float] = mapped_column(NUMERIC(4, 2), default=100.00)
    total_projects: Mapped[int] = mapped_column(INTEGER, default=0)
    completed_on_time: Mapped[int] = mapped_column(INTEGER, default=0)
    penalty_count: Mapped[int] = mapped_column(INTEGER, default=0)
    penalty_amount_inr: Mapped[float] = mapped_column(NUMERIC(12, 2), default=0)
    is_blacklisted: Mapped[bool] = mapped_column(BOOLEAN, default=False)
    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    permits: Mapped[list["Permit"]] = relationship(back_populates="contractor")

    def __repr__(self) -> str:
        return f"<Contractor id={self.id} name={self.name!r} reg={self.registration_number!r}>"


class Permit(Base):
    __tablename__ = "permits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    permit_number: Mapped[str] = mapped_column(VARCHAR(50), unique=True, nullable=False)
    department_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"))
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("contractors.id"))

    road_name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    ward: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    city: Mapped[str] = mapped_column(VARCHAR(100), default="Navi Mumbai")

    trench_polygon: Mapped[str] = mapped_column(Geometry("POLYGON", srid=4326), nullable=False)
    center_point: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))

    proposed_start_date: Mapped[dt.date] = mapped_column(DATE, nullable=False)
    proposed_end_date: Mapped[dt.date] = mapped_column(DATE, nullable=False)
    actual_start_date: Mapped[dt.date | None] = mapped_column(DATE)
    actual_end_date: Mapped[dt.date | None] = mapped_column(DATE)

    status: Mapped[str] = mapped_column(VARCHAR(50), default="pending", nullable=False)

    work_type: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    estimated_depth_meters: Mapped[float | None] = mapped_column(NUMERIC(5, 2))
    estimated_area_sqm: Mapped[float | None] = mapped_column(NUMERIC(10, 2))

    clash_detected: Mapped[bool] = mapped_column(BOOLEAN, default=False)
    clash_permit_ids: Mapped[list[uuid.UUID] | None] = mapped_column(ARRAY(UUID(as_uuid=True)))
    ai_risk_score: Mapped[float | None] = mapped_column(NUMERIC(4, 2))

    blockchain_tx_hash: Mapped[str | None] = mapped_column(VARCHAR(100))
    blockchain_block_number: Mapped[int | None] = mapped_column(BIGINT)

    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    department: Mapped["Department"] = relationship(back_populates="permits")
    contractor: Mapped["Contractor"] = relationship(back_populates="permits")
    clashes_as_a: Mapped[list["Clash"]] = relationship(
        foreign_keys="Clash.permit_a_id", back_populates="permit_a"
    )
    clashes_as_b: Mapped[list["Clash"]] = relationship(
        foreign_keys="Clash.permit_b_id", back_populates="permit_b"
    )
    complaints: Mapped[list["Complaint"]] = relationship(back_populates="permit")

    def __repr__(self) -> str:
        return f"<Permit id={self.id} permit_number={self.permit_number!r} status={self.status!r}>"


class Clash(Base):
    __tablename__ = "clashes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    permit_a_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("permits.id"))
    permit_b_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("permits.id"))
    overlap_area_sqm: Mapped[float | None] = mapped_column(NUMERIC(10, 4))
    overlap_geojson: Mapped[str | None] = mapped_column(TEXT)
    days_overlap: Mapped[int | None] = mapped_column(INTEGER)
    severity: Mapped[str | None] = mapped_column(VARCHAR(20))
    status: Mapped[str | None] = mapped_column(VARCHAR(30), default="open")
    resolution_type: Mapped[str | None] = mapped_column(VARCHAR(50))
    mou_pdf_url: Mapped[str | None] = mapped_column(TEXT)
    mou_blockchain_hash: Mapped[str | None] = mapped_column(VARCHAR(100))
    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)
    resolved_at: Mapped[dt.datetime | None] = mapped_column()

    permit_a: Mapped["Permit"] = relationship(foreign_keys=[permit_a_id], back_populates="clashes_as_a")
    permit_b: Mapped["Permit"] = relationship(foreign_keys=[permit_b_id], back_populates="clashes_as_b")

    def __repr__(self) -> str:
        return f"<Clash id={self.id} a={self.permit_a_id} b={self.permit_b_id} severity={self.severity!r}>"


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    permit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("permits.id"))

    citizen_phone: Mapped[str | None] = mapped_column(VARCHAR(20))
    citizen_name: Mapped[str | None] = mapped_column(VARCHAR(100))
    source: Mapped[str | None] = mapped_column(VARCHAR(30), default="web")

    raw_text: Mapped[str] = mapped_column(TEXT, nullable=False)
    language: Mapped[str | None] = mapped_column(VARCHAR(20), default="en")

    category: Mapped[str | None] = mapped_column(VARCHAR(100))
    sub_category: Mapped[str | None] = mapped_column(VARCHAR(100))
    priority: Mapped[str | None] = mapped_column(VARCHAR(20))
    department_assigned: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"))
    ai_summary: Mapped[str | None] = mapped_column(TEXT)
    sentiment: Mapped[str | None] = mapped_column(VARCHAR(20))

    status: Mapped[str | None] = mapped_column(VARCHAR(30), default="open")
    resolution_notes: Mapped[str | None] = mapped_column(TEXT)

    photo_url: Mapped[str | None] = mapped_column(TEXT)
    photo_verified: Mapped[bool] = mapped_column(BOOLEAN, default=False)
    photo_cv_result: Mapped[dict | None] = mapped_column(JSON)
    citizen_points_awarded: Mapped[int] = mapped_column(INTEGER, default=0)

    complaint_location: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))

    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)
    resolved_at: Mapped[dt.datetime | None] = mapped_column()

    permit: Mapped["Permit"] = relationship(back_populates="complaints")
    department: Mapped["Department"] = relationship(foreign_keys=[department_assigned])

    def __repr__(self) -> str:
        return f"<Complaint id={self.id} status={self.status!r} priority={self.priority!r}>"


class RoadHealth(Base):
    __tablename__ = "road_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    road_name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    ward: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    road_segment: Mapped[str | None] = mapped_column(Geometry("LINESTRING", srid=4326))

    age_years: Mapped[float | None] = mapped_column(NUMERIC(5, 2))
    last_dig_date: Mapped[dt.date | None] = mapped_column(DATE)
    dig_count_5yr: Mapped[int] = mapped_column(INTEGER, default=0)
    surface_condition_score: Mapped[float | None] = mapped_column(NUMERIC(3, 1))
    avg_rainfall_mm_annual: Mapped[float | None] = mapped_column(NUMERIC(8, 2))
    traffic_load_score: Mapped[float | None] = mapped_column(NUMERIC(3, 1))
    pipe_age_water: Mapped[int | None] = mapped_column(INTEGER)
    pipe_age_gas: Mapped[int | None] = mapped_column(INTEGER)
    cable_age_telecom: Mapped[int | None] = mapped_column(INTEGER)

    predicted_dig_probability_90d: Mapped[float | None] = mapped_column(NUMERIC(5, 4))
    prediction_updated_at: Mapped[dt.datetime | None] = mapped_column()
    was_dug_within_90d: Mapped[bool | None] = mapped_column(BOOLEAN)

    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    def __repr__(self) -> str:
        return f"<RoadHealth id={self.id} road_name={self.road_name!r} ward={self.ward!r}>"


class CitizenPoints(Base):
    __tablename__ = "citizen_points"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_phone: Mapped[str] = mapped_column(VARCHAR(20), nullable=False)
    citizen_name: Mapped[str | None] = mapped_column(VARCHAR(100))
    total_points: Mapped[int] = mapped_column(INTEGER, default=0)
    verified_reports: Mapped[int] = mapped_column(INTEGER, default=0)
    badge_level: Mapped[str] = mapped_column(VARCHAR(30), default="newcomer")
    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)
    updated_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    def __repr__(self) -> str:
        return f"<CitizenPoints id={self.id} phone={self.citizen_phone!r} points={self.total_points}>"


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    trigger_event: Mapped[str | None] = mapped_column(VARCHAR(100))
    input_data: Mapped[dict | None] = mapped_column(JSON)
    output_data: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str | None] = mapped_column(VARCHAR(20))
    duration_ms: Mapped[int | None] = mapped_column(INTEGER)
    tokens_used: Mapped[int | None] = mapped_column(INTEGER)
    created_at: Mapped[dt.datetime | None] = mapped_column(default=dt.datetime.utcnow)

    def __repr__(self) -> str:
        return f"<AgentLog id={self.id} agent_name={self.agent_name!r} status={self.status!r}>"

