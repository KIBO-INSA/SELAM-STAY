from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from models.database import get_db, Room, Feedback, MaintenanceLog, Guest, ServiceRequest, Staff
from ai.maintenance import calculate_risk
from ai.pricing import predict_price
import random
import json
import os

from models.database import get_db, Room, Feedback, Guest, ServiceRequest, InventoryItem
from ai.pricing import predict_price
from ai.integrations import get_live_events

router = APIRouter()

# Load Kuriftu Knowledge
KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "kuriftu_knowledge.json")
try:
    with open(KNOWLEDGE_PATH, "r") as f:
        KURIFTU_VILLAS = json.load(f)
except Exception as e:
    print(f"Error loading Kuriftu Knowledge: {e}")
    KURIFTU_VILLAS = {"villas": [{"id": 1, "country": "Ethiopia", "region": "East Africa", "artifacts": [], "cuisine": [], "story": "Error loading cultural data."}]}

PROPERTY_EXPERIENCES = {
    "Bishoftu": [
        {"villa": "Water Park", "engagement": 95, "sentiment": 90, "status": "Star"},
        {"villa": "Kayaking", "engagement": 85, "sentiment": 88, "status": "Active"},
        {"villa": "Lakeside Dining", "engagement": 98, "sentiment": 96, "status": "Star"},
        {"villa": "Spa", "engagement": 75, "sentiment": 80, "status": "Active"},
    ],
    "Entoto": [
        {"villa": "Zipline", "engagement": 92, "sentiment": 89, "status": "Star"},
        {"villa": "Rope Course", "engagement": 78, "sentiment": 82, "status": "Active"},
        {"villa": "Horseback Ride", "engagement": 85, "sentiment": 90, "status": "Active"},
        {"villa": "Archery", "engagement": 60, "sentiment": 75, "status": "Gap"},
    ],
    "African Village": [
        {"villa": "Ethiopia Setup", "engagement": 98, "sentiment": 95, "status": "Star"},
        {"villa": "Kenya Setup", "engagement": 88, "sentiment": 90, "status": "Active"},
        {"villa": "Nigeria Setup", "engagement": 75, "sentiment": 82, "status": "Active"},
        {"villa": "Zambia Setup", "engagement": 45, "sentiment": 60, "status": "Gap"},
    ]
}

@router.get("/summary")
async def dashboard_summary(property: str = "African Village", db: Session = Depends(get_db)):
    """Full dashboard data in one call."""

    # Occupancy
    rooms = db.query(Room).all()
    total_rooms    = len(rooms)
    occupied_rooms = sum(1 for r in rooms if r.is_occupied)
    occupancy_rate = round(occupied_rooms / total_rooms, 2) if total_rooms else 0

    # Revenue snapshot (localized)
    revenue_today_etb = 0.0
    revenue_today_usd = 0.0
    
    for r in rooms:
        if r.is_occupied:
            # If stored in USD, convert to ETB for total ledger, else just add
            price_in_etb = r.current_price if r.currency == "ETB" else r.current_price * (r.exchange_rate or 115.5)
            price_in_usd = r.current_price if r.currency == "USD" else r.current_price / (r.exchange_rate or 1.0)
            
            revenue_today_etb += price_in_etb
            revenue_today_usd += price_in_usd
    
    # Service Revenue (simplified for demo)
    service_rev_etb = 12500.0  # Placeholder for actual service request totals
    service_rev_usd = service_rev_etb / 115.5 

    # Alerts (Sentiment)
    alerts_count = db.query(Feedback).filter(
        Feedback.property_location == property,
        Feedback.sentiment == "negative",
        Feedback.is_resolved == False
    ).count()

    # Localized Demand Events Context
    # African market reality: Major demand surges revolve around diplomatic and real calendar events
    upcoming_events = get_live_events()
    
    # Is a major event happening this week?
    active_diplomatic_event = any(e['days_away'] <= 7 and e['type'] == 'Conference' for e in upcoming_events)

    # Recent feedback sentiment breakdown
    feedbacks = db.query(Feedback).filter(Feedback.property_location == property).order_by(
        Feedback.timestamp.desc()
    ).limit(100).all()

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for f in feedbacks:
        key = (getattr(f, "sentiment", None) or "neutral")
        if key not in sentiment_counts:
            key = "neutral"
        sentiment_counts[key] = sentiment_counts.get(key, 0) + 1

    # Inventory & Supply Chain Analysis (Localized)
    inventory_items = db.query(InventoryItem).filter(InventoryItem.property_location == property).all()
    inventory_alerts = []
    for item in inventory_items:
        if item.current_stock < item.min_stock_level:
            stock_pct = round((item.current_stock / item.min_stock_level) * 100) if item.min_stock_level else 0
            risk_type = "Critical" if stock_pct < 30 else "Warning"
            inventory_alerts.append({
                "item": item.name,
                "status": risk_type,
                "current": item.current_stock,
                "minimum": item.min_stock_level,
                "message": f"Stock at {stock_pct}% of minimum threshold. Reorder {item.name} urgently."
            })

    # Service revenue snapshot (no per-request pricing stored yet)
    service_rev = 0.0

    # Advanced Revenue Metrics
    num_rooms = total_rooms if total_rooms > 0 else 1
    adr = revenue_today_etb / occupied_rooms if occupied_rooms > 0 else 0
    revpar = revenue_today_etb / num_rooms

    # Guest segments (DB-backed counts)
    guests = db.query(Guest).all()
    in_house = [g for g in guests if g.check_out is None]
    segments = {
        "Leisure": sum(1 for g in in_house if "leisure" in (g.preferences or "").lower()),
        "Business": sum(1 for g in in_house if "business" in (g.preferences or "").lower()),
        "Diaspora": sum(1 for g in in_house if g.language == "am"),
    }
    # Ensure we always have some counts even if DB is empty
    if not any(segments.values()):
        segments = {"Leisure": 65, "Business": 25, "Diaspora": 10}

    # Pricing recommendation for rooms
    pricing = predict_price(occupancy=occupancy_rate, base_price=150.0)

    # Dynamic Service Pricing (Yield Management - Localized)
    base_yield = 0.8 if occupancy_rate < 0.5 else 1.1 if occupancy_rate > 0.8 else 1.0
    yield_multiplier = base_yield * (1.3 if active_diplomatic_event else 1.0)
    service_prices = {
        "Signature Coffee Scrub": {"base": 80, "optimized": round(80 * yield_multiplier, 2)},
        "Lakeside Dinner Package": {"base": 120, "optimized": round(120 * yield_multiplier, 2)},
        "Simien Helicopter Tour": {"base": 500, "optimized": round(500 * yield_multiplier, 2)},
    }

    # Predictive Revenue (30-day forecast - Event Driven)
    forecast = []
    for i in range(30):
        multiplier = 1.0
        
        # Simulate weekend demand
        if (datetime.now().weekday() + i) % 7 >= 5:
            multiplier = 1.1
            
        # Simulate local event demand spike (Timkat in 14 days)
        if i >= 13 and i <= 16:
            multiplier = 1.6 # Massive cultural surge
            
        # AU Summit happening in 3 days (days 3-5)
        if i >= 2 and i <= 5:
            multiplier = 1.8 # Maximum diplomatic surge
            
        day_rev = (revpar * total_rooms) * multiplier * random.uniform(0.9, 1.1)
        forecast.append({"day": i + 1, "revenue": round(day_rev, 2)})

    # Generate Prescriptive AI Actions based on events and pacing
    ai_actions = []
    
    # 1. Booking Velocity Action
    if occupancy_rate < 0.6 and any(e['days_away'] <= 14 for e in upcoming_events):
        ai_actions.append({
            "id": "action_pacing",
            "type": "Booking Velocity",
            "title": "Pacing Behind Target",
            "observation": f"At {int(occupancy_rate*100)}% occupancy within 14 days of major event. Historic pacing dictates 65%.",
            "recommendation": "Drop ADR by 5% for the next 48 hours to accelerate bookings.",
            "impact": "High",
            "button_text": "Apply Rate Drop"
        })
    else:
        ai_actions.append({
            "id": "action_pacing",
            "type": "Booking Velocity",
            "title": "Pacing On Track",
            "observation": f"Booking velocity is matching the event curve at {int(occupancy_rate*100)}%.",
            "recommendation": "Hold current rates to maximize RevPAR.",
            "impact": "Low",
            "button_text": "Hold Rates"
        })

    # 2. Supply Chain Action
    if active_diplomatic_event:
        ai_actions.append({
            "id": "action_supply",
            "type": "Supply Order",
            "title": "Conference Consumption Surge",
            "observation": "AU Summit expected to increase premium spirits and coffee consumption by 40%.",
            "recommendation": "Increase orders of single-origin beans and imported whiskey. Supplier lead time is tight.",
            "impact": "High",
            "button_text": "Draft Order"
        })
    elif any(e['type'] == 'Cultural' and e['days_away'] <= 14 for e in upcoming_events):
        ai_actions.append({
            "id": "action_supply",
            "type": "Supply Order",
            "title": "Cultural Event Stock Risk",
            "observation": "Historical data for upcoming holiday shows 150% increase in local lamb turnover.",
            "recommendation": "Current inventory sufficient only for standard operations. Order 40kg today to prevent stockouts.",
            "impact": "Urgent",
            "button_text": "Draft Supplier Order"
        })

    # 3. Labor Action
    if active_diplomatic_event:
        ai_actions.append({
            "id": "action_labor",
            "type": "Labor Optimization",
            "title": "Arrival Bottleneck Predicted",
            "observation": "Flight APIs point to heavy VIP arrivals on Wednesday 5PM-8PM.",
            "recommendation": "Shift 2 concierges to front desk check-in. Pre-assign VIP suites by 2 PM.",
            "impact": "Critical",
            "button_text": "Adjust Roster"
        })

    # 4. Upsell Action
    if active_diplomatic_event:
        ai_actions.append({
            "id": "action_upsell",
            "type": "Upsell Packaging",
            "title": "Diplomatic Segment Upsell",
            "observation": "Diplomatic guests prioritize speed and privacy over cost.",
            "recommendation": "Activate 'Premium 2-Hour Express Laundry' and push 'Private VIP Room Service' packages.",
            "impact": "Medium",
            "button_text": "Push Packages"
        })


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
            "yield_index": round((revpar / 150.0) * 100, 1)
        },
        "revenue": {
            "today_total_etb": round(revenue_today_etb + service_rev, 2),
            "today_total_usd": round((revenue_today_etb + service_rev) / 140.0, 2),
            "today_etb":       round(revenue_today_etb + service_rev, 2),
            "room_revenue_etb": round(revenue_today_etb, 2),
            "service_revenue_etb": round(service_rev, 2),
            "forecast":        forecast,
        },
        "alerts": {
            "unresolved_negative_feedback": alerts_count,
            "supply_chain_risks":           len(inventory_alerts),
            "inventory_details":            inventory_alerts,
            "upcoming_events":              upcoming_events
        },
        "sentiment_breakdown": sentiment_counts,
        "pricing_recommendation": pricing,
        "service_pricing": service_prices,
        "guest_segments": segments,
        "property_performance": PROPERTY_EXPERIENCES.get(property, PROPERTY_EXPERIENCES["African Village"]),
        "ai_actions": ai_actions
    }


@router.get("/tasks")
async def dashboard_tasks(
    db: Session = Depends(get_db),
    limit: int = 50,
    include_completed: bool = False,
    authorization: Optional[str] = Header(None)
):
    """Manager/Staff task schedule with AI recommendations."""
    user_role = "manager"
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ", 1)[1]
            from api.auth_routes import decode_token
            payload = decode_token(token)
            user_role = payload.get("role", "manager")
            user_id = int(payload.get("sub")) if payload.get("sub") else None
        except Exception:
            pass

    q = db.query(ServiceRequest)
    if not include_completed:
        q = q.filter(ServiceRequest.status != "completed")
        
    if user_role == "staff" and user_id:
        q = q.filter(ServiceRequest.assigned_staff_id == user_id)

    tasks = q.order_by(ServiceRequest.created_at.desc()).limit(max(1, min(limit, 200))).all()
    staff_by_id = {s.id: s for s in db.query(Staff).all()}
    
    guests_by_id = {}
    guest_ids = list({t.guest_id for t in tasks if getattr(t, "guest_id", None)})
    if guest_ids:
        guests = db.query(Guest).filter(Guest.id.in_(guest_ids)).all()
        guests_by_id = {g.id: g for g in guests}

    def staff_payload(staff_id: Optional[int]):
        if not staff_id:
            return None
        staff = staff_by_id.get(staff_id)
        if staff:
            return {"id": staff.id, "name": staff.name, "role": staff.role}
        return {"id": staff_id}
        
    def generate_ai_recommendation(task, guest):
        if not guest:
            return "Standard service execution recommended."
            
        prefs_raw = getattr(guest, "preferences", "{}") or "{}"
        try:
            prefs = json.loads(prefs_raw)
        except Exception:
            prefs = {}
            
        food_pref = prefs.get("food", "").lower()
        drink_pref = prefs.get("drink", "").lower()
        activity_pref = prefs.get("activity", "").lower()
        
        cat = (task.category or "").lower()
        
        if "room service" in cat or "food" in cat or "drink" in cat:
            if food_pref or drink_pref:
                items = [i for i in [food_pref, drink_pref] if i]
                return f"AI Strategy: Guest enjoys {' and '.join(items)}. Proactively offer these when handling their request."
        elif "housekeeping" in cat:
            return "AI Strategy: Provide unobtrusive service. Pre-arrange the room to reflect a calm atmosphere."
        elif "spa" in cat or "wellness" in cat:
            return "AI Strategy: Emphasize our locally sourced relaxing treatments when conversing."
        
        if activity_pref:
            return f"AI Strategy: The guest is here for {activity_pref}. Consider a brief mention of relevant on-property activities."
            
        return "AI Strategy: Connect warmly using the guest's name during service delivery."

    return {
        "tasks": [
            {
                "id": t.id,
                "ref_id": t.id,
                "category": t.category,
                "room_number": t.room_number,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "assigned_at": t.assigned_at.isoformat() if t.assigned_at else None,
                "assignment_reason": t.assignment_reason,
                "assigned_staff": staff_payload(t.assigned_staff_id),
                "guest_name": guests_by_id.get(t.guest_id).name if getattr(t, "guest_id", None) and guests_by_id.get(t.guest_id) else None,
                "ai_recommendation": t.staff_recommendation if getattr(t, "staff_recommendation", None) else generate_ai_recommendation(t, guests_by_id.get(t.guest_id) if getattr(t, "guest_id", None) else None),
                "scheduled_at": t.scheduled_at.isoformat() if getattr(t, "scheduled_at", None) else None,
                "created_at": t.created_at.isoformat() if getattr(t, "created_at", None) else None,
                "updated_at": t.updated_at.isoformat() if getattr(t, "updated_at", None) else None,
            }
            for t in tasks
        ]
    }

@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: int, db: Session = Depends(get_db)):
    """Mark a service request as completed."""
    task = db.query(ServiceRequest).filter(ServiceRequest.id == task_id).first()
    if not task:
        return {"error": "Task not found."}
    task.status = "completed"
    task.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "task_id": task_id}

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
