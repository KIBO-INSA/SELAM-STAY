from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from ai.scheduler import generate_schedule, default_forecast
from models.database import get_db, Staff

router = APIRouter()


@router.get("/week")
async def get_weekly_schedule(db: Session = Depends(get_db)):
    staff = db.query(Staff).all()
    staff_list = [
        {"id": s.id, "name": s.name, "role": s.role,
         "days_off": s.days_off}
        for s in staff
    ]
    forecast = default_forecast()
    schedule = generate_schedule(forecast, staff_list)
    return {"forecast": forecast, "schedule": schedule}


@router.get("/staff")
async def get_staff(db: Session = Depends(get_db)):
    staff = db.query(Staff).all()
    return [
        {"id": s.id, "name": s.name, "role": s.role,
         "days_off": json.loads(s.days_off)}
        for s in staff
    ]
