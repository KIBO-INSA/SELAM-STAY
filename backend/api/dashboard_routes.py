from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from models.database import get_db, Room, Feedback, MaintenanceLog, Guest
from ai.maintenance import calculate_risk
from ai.pricing import predict_price

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(db: Session = Depends(get_db)):
    """Full dashboard data in one call."""

    # Occupancy
    rooms = db.query(Room).all()
    total_rooms    = len(rooms)
    occupied_rooms = sum(1 for r in rooms if r.is_occupied)
    occupancy_rate = round(occupied_rooms / total_rooms, 2) if total_rooms else 0

    # Revenue snapshot
    revenue_today = sum(
        r.current_price for r in rooms if r.is_occupied
    )

    # Alerts
    alerts = db.query(Feedback).filter(
        Feedback.sentiment == "negative",
        Feedback.is_resolved == False
    ).count()

    # Maintenance critical count
    logs = db.query(MaintenanceLog).all()
    critical_count = 0
    for log in logs:
        risk = calculate_risk(log.equipment, log.usage_hours,
                              log.last_service or datetime.utcnow())
        if risk["risk_level"] == "critical":
            critical_count += 1

    # Recent feedback sentiment breakdown
    feedbacks = db.query(Feedback).order_by(
        Feedback.timestamp.desc()
    ).limit(100).all()

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for f in feedbacks:
        sentiment_counts[f.sentiment] = sentiment_counts.get(f.sentiment, 0) + 1

    # Pricing recommendation
    pricing = predict_price(occupancy=occupancy_rate, base_price=150.0)

    return {
        "occupancy": {
            "total_rooms":    total_rooms,
            "occupied":       occupied_rooms,
            "rate":           occupancy_rate,
            "percentage":     f"{int(occupancy_rate * 100)}%",
        },
        "revenue": {
            "today_etb":      round(revenue_today, 2),
            "recommended_avg_price": pricing["recommended_price"],
        },
        "alerts": {
            "unresolved_negative_feedback": alerts,
            "critical_maintenance":         critical_count,
        },
        "sentiment_breakdown": sentiment_counts,
        "pricing_recommendation": pricing,
    }
