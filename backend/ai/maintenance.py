"""
Predictive maintenance risk scoring for resort equipment.
Rule-based engine with configurable thresholds per equipment type.
"""

from datetime import datetime, timedelta

EQUIPMENT_CONFIG = {
    "AC Unit":      {"max_hours": 500,  "service_days": 90},
    "Pool Pump":    {"max_hours": 300,  "service_days": 60},
    "Generator":    {"max_hours": 1000, "service_days": 180},
    "Elevator":     {"max_hours": 800,  "service_days": 120},
    "Water Heater": {"max_hours": 600,  "service_days": 90},
    "HVAC System":  {"max_hours": 700,  "service_days": 120},
    "Fire Alarm":   {"max_hours": 9999, "service_days": 365},
}

DEFAULT_CONFIG = {"max_hours": 500, "service_days": 90}


def calculate_risk(equipment: str, usage_hours: float,
                   last_service: datetime) -> dict:
    """Calculate maintenance risk score for a piece of equipment."""
    cfg = EQUIPMENT_CONFIG.get(equipment, DEFAULT_CONFIG)
    days_since = (datetime.now() - last_service).days

    hour_risk = min(usage_hours / cfg["max_hours"], 1.0)
    time_risk  = min(days_since / cfg["service_days"], 1.0)
    risk_score = round((hour_risk * 0.6) + (time_risk * 0.4), 3)

    if risk_score > 0.8:
        risk_level = "critical"
    elif risk_score > 0.5:
        risk_level = "warning"
    else:
        risk_level = "safe"

    days_left = max(0, int((1 - risk_score) * 30))
    predicted_failure = (datetime.now() + timedelta(days=days_left)).strftime("%Y-%m-%d")

    return {
        "equipment":          equipment,
        "usage_hours":        usage_hours,
        "days_since_service": days_since,
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "predicted_failure":  predicted_failure,
        "action_required":    risk_score > 0.5,
        "recommendation":     _get_recommendation(risk_level, equipment),
    }


def _get_recommendation(risk_level: str, equipment: str) -> str:
    if risk_level == "critical":
        return f"⚠️ Schedule immediate maintenance for {equipment}."
    elif risk_level == "warning":
        return f"🔶 Plan maintenance for {equipment} within 2 weeks."
    else:
        return f"✅ {equipment} is operating normally."
