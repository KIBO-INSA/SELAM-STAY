INTENT_SLOTS = {
    "towels": ["quantity", "time"],
    "food_order": ["item", "quantity", "time"],
    "housekeeping": ["time"],
    "maintenance_request": ["issue_type", "urgency"],
    "spa_booking": ["treatment", "date", "time"],
    "late_checkout": ["time", "date"],
}


INTENT_TO_CATEGORY = {
    "towels": "Housekeeping",
    "housekeeping": "Housekeeping",
    "food_order": "Room Service",
    "maintenance_request": "Maintenance",
    "spa_booking": "Spa",
    "late_checkout": "Special",
}
