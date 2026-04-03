from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from ai.maintenance import calculate_risk
from models.database import get_db, MaintenanceLog

router = APIRouter()


@router.get("/all")
async def get_all(db: Session = Depends(get_db)):
    logs = db.query(MaintenanceLog).all()
    results = []
    for log in logs:
        risk = calculate_risk(
            log.equipment,
            log.usage_hours,
            log.last_service or datetime.utcnow()
        )
        # Update stored risk score
        log.risk_score = risk["risk_score"]
        log.risk_level = risk["risk_level"]
        log.predicted_failure = risk["predicted_failure"]
        results.append(risk)

    db.commit()
    return results


@router.get("/critical")
async def get_critical(db: Session = Depends(get_db)):
    logs = db.query(MaintenanceLog).all()
    critical = []
    for log in logs:
        risk = calculate_risk(log.equipment, log.usage_hours,
                              log.last_service or datetime.utcnow())
        if risk["risk_level"] in ["critical", "warning"]:
            critical.append(risk)
    return critical
