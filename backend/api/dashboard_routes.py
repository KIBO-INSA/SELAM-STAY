from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from models.database import get_db, Room, Feedback, MaintenanceLog, Guest, ServiceRequest
from ai.maintenance import calculate_risk
from ai.pricing import predict_price
import random
import json
import os

router = APIRouter()

# Load Kuriftu Knowledge
KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "kuriftu_knowledge.json")
try:
    with open(KNOWLEDGE_PATH, "r") as f:
        KURIFTU_VILLAS = json.load(f)
except Exception as e:
    print(f"Error loading Kuriftu Knowledge: {e}")
    # Fallback structure
    KURIFTU_VILLAS = {"villas": [{"id": 1, "country": "Ethiopia", "region": "East Africa", "artifacts": [], "cuisine": [], "story": "Error loading cultural data."}]}


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
        key = (getattr(f, "sentiment", None) or "neutral")
        if key not in sentiment_counts:
            key = "neutral"
        sentiment_counts[key] = sentiment_counts.get(key, 0) + 1

    # Advanced Revenue Metrics
    num_rooms = total_rooms if total_rooms > 0 else 1
    adr = revenue_today / occupied_rooms if occupied_rooms > 0 else 0
    revpar = revenue_today / num_rooms
    
    # Pricing recommendation for rooms
    pricing = predict_price(occupancy=occupancy_rate, base_price=150.0)

    # Dynamic Service Pricing (Yield Management)
    # If occupancy is low (<50%), we apply a 20% "Flash Discount" to drive traffic
    yield_multiplier = 0.8 if occupancy_rate < 0.5 else 1.1 if occupancy_rate > 0.8 else 1.0
    service_prices = {
        "Signature Coffee Scrub": {"base": 80, "optimized": round(80 * yield_multiplier, 2)},
        "Lakeside Dinner Package": {"base": 120, "optimized": round(120 * yield_multiplier, 2)},
        "Simien Helicopter Tour": {"base": 500, "optimized": round(500 * yield_multiplier, 2)},
    }

    # Service revenue snapshot (no per-request pricing stored yet)
    service_rev = 0.0

    # Guest segments (simple, DB-backed counts)
    guests = db.query(Guest).all()
    in_house = [g for g in guests if g.check_out is None]
    segments = {
        "in_house": len(in_house),
        "total_guests": len(guests),
        "language_en": sum(1 for g in guests if (g.language or "").lower() == "en"),
        "language_am": sum(1 for g in guests if (g.language or "").lower() == "am"),
    }

    # Predictive Revenue (30-day forecast simulation)
    # Using a trend based on ADR and occupancy
    forecast = []
    for i in range(30):
        # Weekend surge simulation
        is_weekend = (datetime.now().weekday() + i) % 7 >= 5
        multiplier = 1.3 if is_weekend else 0.95
        day_rev = (revpar * total_rooms) * multiplier * random.uniform(0.9, 1.1)
        forecast.append({"day": i + 1, "revenue": round(day_rev, 2)})

    return {
        "occupancy": {
            "total_rooms":    total_rooms,
            "occupied":       occupied_rooms,
            "rate":           occupancy_rate,
            "percentage":     f"{int(occupancy_rate * 100)}%",
        },
        "kpis": {
            "adr": round(adr, 2),
            "revpar": round(revpar, 2),
            "yield_index": round((revpar / 150.0) * 100, 1) # Relative to base
        },
        "revenue": {
            "today_total":    round(revenue_today + service_rev, 2),
            # Back-compat for frontend (expects today_etb)
            "today_etb":      round(revenue_today + service_rev, 2),
            "room_revenue":   round(revenue_today, 2),
            "service_revenue": round(service_rev, 2),
            "forecast":       forecast,
        },
        "alerts": {
            "unresolved_negative_feedback": alerts,
            "critical_maintenance":         critical_count,
        },
        "sentiment_breakdown": sentiment_counts,
        "pricing_recommendation": pricing,
        "service_pricing": service_prices,
        "guest_segments": segments,
        "cultural_performance": [
            {"villa": "Ethiopia", "engagement": 98, "sentiment": 95, "status": "Star"},
            {"villa": "Kenya",     "engagement": 88, "sentiment": 90, "status": "Active"},
            {"villa": "Nigeria",   "engagement": 75, "sentiment": 82, "status": "Active"},
            {"villa": "Zambia",    "engagement": 45, "sentiment": 60, "status": "Gap"},
            {"villa": "Morocco",   "engagement": 92, "sentiment": 94, "status": "Star"},
            {"villa": "Egypt",     "engagement": 65, "sentiment": 72, "status": "Active"},
        ],
    }

@router.get("/guest/villa-theme/{guest_id}")
async def get_guest_villa_theme(guest_id: str, db: Session = Depends(get_db)):
    try:
        # Check if the guest exists in DB to get their room_id
        gid_val = guest_id.replace("guest-", "")
        if gid_val.isdigit():
            guest = db.query(Guest).filter(Guest.id == int(gid_val)).first()
            if guest and guest.room_id:
                villa = next((v for v in KURIFTU_VILLAS["villas"] if v["id"] == guest.room_id), KURIFTU_VILLAS["villas"][0])
                return villa
        
        # Fallback mapping for demo
        villa_map = {
            "guest-1": KURIFTU_VILLAS["villas"][0], # Ethiopia
            "guest-2": KURIFTU_VILLAS["villas"][1], # Kenya
            "guest-3": KURIFTU_VILLAS["villas"][2], # Nigeria
        }
        return villa_map.get(guest_id, KURIFTU_VILLAS["villas"][0])
    except Exception as e:
        print(f"Error in get_guest_villa_theme: {e}")
        return KURIFTU_VILLAS["villas"][0]
