"""
Smart staff scheduler based on occupancy forecasts.
Assigns shifts and balances workload across the week.
"""

import json
from datetime import date, timedelta

SHIFTS = ["Morning (6am–2pm)", "Afternoon (2pm–10pm)", "Night (10pm–6am)"]
ROLES  = ["Front Desk", "Housekeeping", "Restaurant", "Security", "Maintenance"]


def generate_schedule(occupancy_forecast: list, staff_list: list) -> list:
    """
    Generate a 7-day staff schedule.

    Args:
        occupancy_forecast: list of 7 floats (0.0 – 1.0)
        staff_list: list of dicts with keys: id, name, role, days_off (list of int)

    Returns:
        list of daily schedule dicts
    """
    schedule = []
    for day_offset, occupancy in enumerate(occupancy_forecast[:7]):
        day = date.today() + timedelta(days=day_offset)
        weekday = day.weekday()

        available = [
            s for s in staff_list
            if weekday not in json.loads(s.get("days_off", "[]"))
        ]

        staff_needed = max(2, int(occupancy * len(available) * 0.9))
        assigned = available[:staff_needed]

        shift_assignments = {}
        role_groups: dict = {}
        for s in assigned:
            role = s.get("role", "General")
            role_groups.setdefault(role, []).append(s["name"])

        for i, s in enumerate(assigned):
            shift_assignments[s["name"]] = SHIFTS[i % len(SHIFTS)]

        schedule.append({
            "date":        day.isoformat(),
            "weekday":     day.strftime("%A"),
            "occupancy":   round(occupancy, 2),
            "staff_needed": staff_needed,
            "total_available": len(available),
            "assignments": shift_assignments,
            "by_role":     role_groups,
        })

    return schedule


def default_forecast() -> list:
    """Return a realistic sample 7-day occupancy forecast."""
    return [0.65, 0.70, 0.55, 0.60, 0.85, 0.95, 0.90]
