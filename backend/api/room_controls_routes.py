from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, RoomControl, Room
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class RoomControlUpdate(BaseModel):
    temperature: Optional[float] = None
    lighting_mode: Optional[str] = None
    dnd_active: Optional[bool] = None
    curtain_open: Optional[bool] = None


@router.get("/{room_id}")
def get_room_controls(room_id: int, db: Session = Depends(get_db)):
    """Get the current smart controls state for a room."""
    ctrl = db.query(RoomControl).filter(RoomControl.room_id == room_id).first()
    if not ctrl:
        # Auto-create default controls for this room
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        ctrl = RoomControl(room_id=room_id)
        db.add(ctrl)
        db.commit()
        db.refresh(ctrl)

    return {
        "room_id": ctrl.room_id,
        "temperature": ctrl.temperature,
        "lighting_mode": ctrl.lighting_mode,
        "dnd_active": ctrl.dnd_active,
        "curtain_open": ctrl.curtain_open,
        "last_updated": ctrl.last_updated.isoformat() if ctrl.last_updated else None
    }


@router.post("/{room_id}")
def update_room_controls(room_id: int, update: RoomControlUpdate, db: Session = Depends(get_db)):
    """Update smart controls for a room."""
    ctrl = db.query(RoomControl).filter(RoomControl.room_id == room_id).first()
    if not ctrl:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        ctrl = RoomControl(room_id=room_id)
        db.add(ctrl)

    if update.temperature is not None:
        ctrl.temperature = max(18.0, min(30.0, update.temperature))
    if update.lighting_mode is not None:
        ctrl.lighting_mode = update.lighting_mode
    if update.dnd_active is not None:
        ctrl.dnd_active = update.dnd_active
    if update.curtain_open is not None:
        ctrl.curtain_open = update.curtain_open

    ctrl.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(ctrl)

    return {
        "status": "updated",
        "room_id": ctrl.room_id,
        "temperature": ctrl.temperature,
        "lighting_mode": ctrl.lighting_mode,
        "dnd_active": ctrl.dnd_active,
        "curtain_open": ctrl.curtain_open,
    }
