import json
import os
from datetime import datetime
from typing import Optional


_KNOWLEDGE = None


def _load_knowledge() -> dict:
    global _KNOWLEDGE
    if _KNOWLEDGE is not None:
        return _KNOWLEDGE

    path = os.path.join(os.path.dirname(__file__), "..", "ai", "knowledge.json")
    path = os.path.abspath(path)
    with open(path, "r", encoding="utf-8") as f:
        _KNOWLEDGE = json.load(f)
    return _KNOWLEDGE


def _is_schedule_query(lower: str) -> bool:
    return any(k in lower for k in ["schedule", "what's on", "whats on", "today", "tonight", "events", "activities"])


def _is_services_query(lower: str) -> bool:
    return any(k in lower for k in ["what services", "services you have", "what can you do", "help with", "can you do"]) or lower.strip() == "services"


def _is_tibeb_prices_query(lower: str) -> bool:
    if "tibeb" not in lower:
        return False
    return any(k in lower for k in ["price", "prices", "cost", "menu", "how much", "food prices"])


def _is_local_discovery_query(lower: str) -> bool:
    return any(k in lower for k in [
        "hidden gems",
        "local hidden gems",
        "local discovery",
        "nearby",
        "around here",
        "what to do nearby",
        "local attractions",
        "show me local",
    ])


def try_answer(message: str) -> Optional[str]:
    """Deterministic fallback answers for common guest questions.

    Returns a plain-text answer if we can answer without LLMs, otherwise None.
    """

    text = (message or "").strip()
    lower = text.lower()

    if _is_services_query(lower):
        return (
            "Here are the main things I can help with right now:\n\n"
            "- Fresh towels\n"
            "- Food orders (room service)\n"
            "- Housekeeping\n"
            "- Spa booking\n"
            "- Maintenance requests\n"
            "- Late checkout\n\n"
            "Tell me what you'd like, and I'll take care of it."
        )

    data = _load_knowledge()

    if _is_tibeb_prices_query(lower):
        dining = data.get("dining", {})
        tibeb = None
        for r in dining.get("restaurants", []):
            if (r.get("name") or "").lower().startswith("tibeb"):
                tibeb = r
                break
        if not tibeb:
            return "I can't find Tibeb restaurant pricing right now."

        lines = [
            f"{(tibeb.get('name') or '').replace('—', '-')} ({(tibeb.get('hours') or '').replace('—', '-')})",
        ]
        bb = tibeb.get("breakfast_buffet")
        if bb and isinstance(bb, dict):
            lines.append(f"Breakfast buffet: ETB {bb.get('price')} ({bb.get('hours')})")

        sig = tibeb.get("signature_dishes") or []
        if sig:
            lines.append("Signature dishes (ETB):")
            for d in sig[:6]:
                name = (d.get("name") or "").replace("—", "-")
                price = d.get("price")
                if name and price is not None:
                    lines.append(f"- {name}: {price}")

        rs = dining.get("room_service")
        if rs and isinstance(rs, dict):
            extra = rs.get("extra_charge")
            if extra is not None:
                lines.append(f"Room service: +ETB {extra} service charge")

        return "\n".join(lines)

    if _is_schedule_query(lower):
        activities = data.get("activities", {}).get("on_site", [])
        # Keep it concise; show top items.
        lines = ["Here are today's on-site highlights:"]
        for a in activities[:6]:
            name = (a.get("name") or "").replace("—", "-")
            time = (a.get("time") or "").replace("—", "-")
            price = a.get("price")
            if name and time:
                price_txt = "" if price in (None, 0) else f" (ETB {price})"
                lines.append(f"- {name} - {time}{price_txt}")

        # Add a time-aware nudge
        hour = datetime.now().hour
        schedule = data.get("proactive_schedule", {})
        if 6 <= hour < 9:
            key = "morning_6_to_9"
        elif 9 <= hour < 12:
            key = "morning_9_to_12"
        elif 12 <= hour < 17:
            key = "afternoon_12_to_17"
        elif 17 <= hour < 19:
            key = "afternoon_17_to_19"
        else:
            key = "evening_19_to_24"

        tip = schedule.get(key)
        if tip:
            lines.append("")
            lines.append(tip)

        return "\n".join(lines)

    if _is_local_discovery_query(lower):
        data = _load_knowledge()
        attractions = data.get("local_attractions", [])
        if not attractions:
            return "I don't have local attraction suggestions right now."

        lines = ["Here are a few local hidden gems near the resort:"]
        for a in attractions[:5]:
            name = (a.get("name") or "").replace("—", "-")
            dist = (a.get("dist") or "").replace("—", "-")
            desc = (a.get("desc") or "").replace("—", "-")
            if name and dist:
                lines.append(f"- {name} ({dist}): {desc}")
            elif name:
                lines.append(f"- {name}: {desc}")
        return "\n".join(lines)

    return None
