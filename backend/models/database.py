from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import json

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./selam.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Guest(Base):
    __tablename__ = "guests"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    email         = Column(String, unique=True, nullable=True)
    phone         = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    language      = Column(String, default="en")  # "en" or "am"
    preferences   = Column(String, default="{}")  # JSON string
    room_number   = Column(String, nullable=True)  # e.g. "101"
    check_in      = Column(DateTime, default=datetime.utcnow)
    check_out     = Column(DateTime, nullable=True)
    room_id       = Column(Integer, nullable=True)
    special_notes = Column(String, nullable=True)


class Room(Base):
    __tablename__ = "rooms"
    id            = Column(Integer, primary_key=True, index=True)
    room_number   = Column(String, unique=True)
    type          = Column(String)         # standard / suite / eco-cabin
    base_price    = Column(Float)
    current_price = Column(Float)
    is_occupied   = Column(Boolean, default=False)
    last_service  = Column(DateTime, default=datetime.utcnow)
    currency      = Column(String, default="ETB")        # ETB or USD
    exchange_rate = Column(Float, default=1.0)          # 1.0 for ETB, current market for USD
    property_location = Column(String, default="African Village")


class Feedback(Base):
    __tablename__ = "feedback"
    id          = Column(Integer, primary_key=True, index=True)
    guest_id    = Column(Integer)
    room_number = Column(String, default="N/A")
    message     = Column(String)
    sentiment   = Column(String, default="neutral")
    score       = Column(Float, default=0.5)
    timestamp   = Column(DateTime, default=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)
    property_location = Column(String, default="African Village")


class MaintenanceLog(Base):
    __tablename__ = "maintenance"
    id                = Column(Integer, primary_key=True, index=True)
    equipment         = Column(String)
    usage_hours       = Column(Float)
    last_service      = Column(DateTime)
    predicted_failure = Column(String, nullable=True)
    risk_score        = Column(Float, default=0.0)
    risk_level        = Column(String, default="safe")


class Staff(Base):
    __tablename__ = "staff"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    role          = Column(String)
    days_off      = Column(String, default="[]")  # JSON list of weekday ints


class User(Base):
    """Accounts for Staff and Manager roles — seeded by admin."""
    __tablename__ = "users"
    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String)
    identifier        = Column(String, unique=True)  # emp_id or admin_code
    role              = Column(String)               # "staff" or "manager"
    department        = Column(String, nullable=True)
    property_location = Column(String, default="African Village")
    password_hash     = Column(String)
    is_active         = Column(Boolean, default=True)


class InventoryItem(Base):
    __tablename__ = "inventory"
    id              = Column(Integer, primary_key=True)
    name            = Column(String, unique=True)
    category        = Column(String) # Food, Cleaning, Linens, etc.
    current_stock   = Column(Float)
    min_stock_level = Column(Float)
    unit_measure    = Column(String) # kg, liters, units
    unit_cost       = Column(Float)
    supplier        = Column(String)
    lead_time_days  = Column(Integer, default=3)   # Days for supply to arrive
    property_location = Column(String, default="African Village")


class RoomControl(Base):
    __tablename__ = "room_controls"
    id              = Column(Integer, primary_key=True, index=True)
    room_id         = Column(Integer)  # FK to rooms.id
    temperature     = Column(Float, default=22.0)
    lighting_mode   = Column(String, default="Relaxing")  # Reading, Relaxing, Sleep, Ethiopian Ambiance
    dnd_active      = Column(Boolean, default=False)
    curtain_open    = Column(Boolean, default=True)
    last_updated    = Column(DateTime, default=datetime.utcnow)


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id              = Column(Integer, primary_key=True, index=True)
    guest_id        = Column(Integer)
    room_number     = Column(String)
    category        = Column(String)  # Room Service, Housekeeping, Spa, Transport, Special
    description     = Column(String)
    status          = Column(String, default="pending")  # pending, in_progress, completed
    priority        = Column(String, default="normal")  # low, normal, high, urgent
    metadata_json   = Column(String, default="{}")
    assigned_staff_id = Column(Integer, nullable=True)
    assigned_at     = Column(DateTime, nullable=True)
    assignment_reason = Column(String, nullable=True)
    currency        = Column(String, default="ETB")
    exchange_rate   = Column(Float, default=1.0)
    property_location = Column(String, default="African Village")
    staff_recommendation = Column(String, nullable=True) # AI-generated personalization note
    scheduled_at    = Column(DateTime, nullable=True)     # Specific time/date requested by guest
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow)


class ConversationState(Base):
    __tablename__ = "conversation_state"
    id                 = Column(Integer, primary_key=True, index=True)
    guest_id           = Column(Integer, index=True, unique=True)
    active_intent      = Column(String, nullable=True)
    conversation_stage = Column(String, default="idle")  # idle, slot_filling, confirming, idle_silent
    collected_slots    = Column(String, default="{}")    # JSON dict
    pending_slots      = Column(String, default="[]")    # JSON list
    completion_status  = Column(String, default="")
    greeted            = Column(Boolean, default=False)
    updated_at         = Column(DateTime, default=datetime.utcnow)

    def get_collected(self) -> dict:
        try:
            return json.loads(self.collected_slots or "{}")
        except Exception:
            return {}

    def set_collected(self, value: dict):
        self.collected_slots = json.dumps(value or {}, ensure_ascii=False)

    def get_pending(self) -> list:
        try:
            return json.loads(self.pending_slots or "[]")
        except Exception:
            return []

    def set_pending(self, value: list):
        self.pending_slots = json.dumps(value or [], ensure_ascii=False)


class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    id          = Column(Integer, primary_key=True, index=True)
    guest_id    = Column(Integer)
    role        = Column(String)  # "user" or "assistant"
    content     = Column(String)
    intent      = Column(String, nullable=True)
    timestamp   = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)

    # Lightweight SQLite migrations (add missing columns only)
    if str(engine.url).startswith("sqlite"):
        with engine.begin() as conn:
            def _existing_cols(table: str) -> set:
                rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                return {r[1] for r in rows}

            def _add_col(table: str, col_name: str, col_type_sql: str, default_sql: str | None = None):
                default_clause = f" DEFAULT {default_sql}" if default_sql is not None else ""
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type_sql}{default_clause}"))

            # guests: add auth + phone + room_number + special_notes
            try:
                cols = _existing_cols("guests")
                if "password_hash" not in cols:
                    _add_col("guests", "password_hash", "TEXT")
                if "phone" not in cols:
                    _add_col("guests", "phone", "TEXT")
                if "room_number" not in cols:
                    _add_col("guests", "room_number", "TEXT")
                if "special_notes" not in cols:
                    _add_col("guests", "special_notes", "TEXT")
            except Exception:
                pass

            # service_requests: metadata + assignment fields
            try:
                cols = _existing_cols("service_requests")
                if "metadata_json" not in cols:
                    _add_col("service_requests", "metadata_json", "TEXT", "'{}'")
                if "assigned_staff_id" not in cols:
                    _add_col("service_requests", "assigned_staff_id", "INTEGER")
                if "assigned_at" not in cols:
                    _add_col("service_requests", "assigned_at", "DATETIME")
                if "assignment_reason" not in cols:
                    _add_col("service_requests", "assignment_reason", "TEXT")
                if "staff_recommendation" not in cols:
                    _add_col("service_requests", "staff_recommendation", "TEXT")
                if "scheduled_at" not in cols:
                    _add_col("service_requests", "scheduled_at", "DATETIME")
            except Exception:
                pass

            # conversation_history: optional intent memory
            try:
                cols = _existing_cols("conversation_history")
                if "intent" not in cols:
                    _add_col("conversation_history", "intent", "TEXT")
            except Exception:
                pass
