from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./selam.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Guest(Base):
    __tablename__ = "guests"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String)
    email       = Column(String, unique=True)
    language    = Column(String, default="en")  # "en" or "am"
    preferences = Column(String, default="{}")   # JSON string
    check_in    = Column(DateTime, default=datetime.utcnow)
    check_out   = Column(DateTime, nullable=True)
    room_id     = Column(Integer, nullable=True)


class Room(Base):
    __tablename__ = "rooms"
    id            = Column(Integer, primary_key=True, index=True)
    room_number   = Column(String, unique=True)
    type          = Column(String)         # standard / suite / eco-cabin
    base_price    = Column(Float)
    current_price = Column(Float)
    is_occupied   = Column(Boolean, default=False)
    last_service  = Column(DateTime, default=datetime.utcnow)


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
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String)
    role     = Column(String)
    days_off = Column(String, default="[]")  # JSON list of weekday ints


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
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow)


class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    id          = Column(Integer, primary_key=True, index=True)
    guest_id    = Column(Integer)
    role        = Column(String)  # "user" or "assistant"
    content     = Column(String)
    timestamp   = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
