from typing import Any, Dict, Optional


def get_next_recommendation(context: Dict[str, Any]) -> Optional[str]:
    """Return exactly one short next-step recommendation, or None.

    Rules are deterministic and intentionally simple.
    """

    if not context:
        return None

    # If the user is mid-workflow, don't add extra suggestions.
    if context.get("active_stage") in {"slot_filling", "confirming"}:
        return None

    last_intent = context.get("last_intent")
    recent_topics = set(context.get("recent_topics") or [])
    prefs = set(context.get("preferences") or [])
    recent_user_text = (context.get("recent_user_text") or "").lower()

    # Prioritize what the guest just asked (avoid suggesting unrelated actions due to older messages).
    if any(k in recent_user_text for k in ["what services", "services you have", "what can you do", "help with", "services"]):
        return "Would you like me to place a service request (towels, housekeeping, maintenance, or late checkout)?"

    if ("tibeb" in recent_user_text) and any(k in recent_user_text for k in ["price", "prices", "cost", "menu", "how much"]):
        return "Would you like to order from Tibeb restaurant now?"

    if any(k in recent_user_text for k in ["what's on", "whats on", "schedule", "today", "tonight"]):
        return "Would you like me to reserve a spa session or cooking class for you?"

    if "schedule" in recent_topics:
        if "wellness" in prefs:
            return "Would you like me to book a spa session for you?"
        if "dining" in prefs:
            return "Would you like to reserve a table at Tibeb restaurant?"
        return "Would you like me to recommend and reserve a top experience for today?"

    if "food" in recent_topics:
        return "Would you like to order from Tibeb restaurant now?"

    if last_intent == "spa_booking" or "spa" in recent_topics:
        return "Would you like to add a massage or facial to your spa booking?"

    if "services" in recent_topics:
        return "Would you like me to place a service request (towels, housekeeping, maintenance, late checkout)?"

    if "local" in recent_topics:
        return "Want a quick list of nearby hidden gems tailored to today’s weather and time?"

    if "activities" in recent_topics:
        return "Would you like me to reserve today’s coffee ceremony experience for you?"

    # Idle fallback
    return "Today’s top experience is the coffee ceremony at 5 PM. Would you like me to reserve it for you?"
