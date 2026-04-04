from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
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
        sentiment_counts[f.sentiment] = sentiment_counts.get(f.sentiment, 0) + 1

    # Inventory & Supply Chain Analysis (Localized)
    inventory_items = db.query(InventoryItem).filter(InventoryItem.property_location == property).all()
    inventory_alerts = []
    for item in inventory_items:
        # Simple logic: if stock is below min, and lead time is > 3 days, it's a "Supply Risk"
        if item.current_stock < item.min_stock_level:
            risk_type = "Critical" if item.lead_time_days > 5 else "Warning"
            inventory_alerts.append({
                "item": item.name,
                "status": risk_type,
                "lead_time": f"{item.lead_time_days} days",
                "message": f"Low stock of {item.name}. Reorder immediately due to {item.lead_time_days} day lead time."
            })

    # Advanced Revenue Metrics
    num_rooms = total_rooms if total_rooms > 0 else 1
    adr = revenue_today_etb / occupied_rooms if occupied_rooms > 0 else 0
    revpar = revenue_today_etb / num_rooms
    
    segments = {"Leisure": 65, "Business": 25, "Diaspora": 10}
    
    # Pricing recommendation for rooms
    pricing = predict_price(occupancy=occupancy_rate, base_price=150.0)

    # Dynamic Service Pricing (Yield Management - Localized)
    # Yield is increased significantly if there is an active local event (like AU Summit)
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
            "today_total_etb": round(revenue_today_etb + service_rev_etb, 2),
            "today_total_usd": round(revenue_today_usd + service_rev_usd, 2),
            "room_revenue_etb": round(revenue_today_etb, 2),
            "service_revenue_etb": round(service_rev_etb, 2),
            "forecast":       forecast,
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
