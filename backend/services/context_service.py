import json
import re
from collections import Counter
from typing import Any, Dict, List, Optional

from models.database import ConversationHistory, ConversationState, SessionLocal


_TOPIC_KEYWORDS = {
    "schedule": ["schedule", "today", "tonight", "what's on", "whats on", "events"],
    "spa": ["spa", "massage", "facial", "treatment", "wellness", "sauna"],
    "food": ["food", "menu", "restaurant", "prices", "price", "tibeb", "dinner", "lunch", "breakfast"],
    "activities": ["activity", "activities", "kayak", "yoga", "hike", "tour", "coffee ceremony"],
    "services": ["services", "housekeeping", "towels", "maintenance", "late checkout", "room service"],
    "local": ["local", "hidden gems", "attractions", "nearby", "explore"],
}

_TOPIC_TO_PREFERENCES = {
    "spa": "wellness",
    "food": "dining",
    "activities": "experiences",
    "local": "exploring",
}


def _extract_topics(text: str) -> List[str]:
    if not text:
        return []
    lower = text.lower()
    topics: List[str] = []
    for topic, keys in _TOPIC_KEYWORDS.items():
        if any(k in lower for k in keys):
            topics.append(topic)
    return topics


def build_context(guest_id: str, *, db=None, limit: int = 10) -> Dict[str, Any]:
    """Build a small structured context snapshot from recent chat history.

    This is intentionally lightweight and deterministic (no LLM dependency).
    """

    owns_db = db is None
    if owns_db:
        db = SessionLocal()

    try:
        gid = int(str(guest_id).replace("guest-", ""))

        rows = (
            db.query(ConversationHistory)
            .filter(ConversationHistory.guest_id == gid)
            .order_by(ConversationHistory.timestamp.desc())
            .limit(max(1, min(int(limit), 50)))
            .all()
        )

        # newest -> oldest; make oldest -> newest for analysis
        rows = list(reversed(rows))

        last_intent: Optional[str] = None
        for r in reversed(rows):
            if getattr(r, "intent", None):
                last_intent = r.intent
                break

        # Prefer active workflow intent when present
        state = db.query(ConversationState).filter(ConversationState.guest_id == gid).first()
        if state and state.active_intent:
            last_intent = state.active_intent

        topic_counts = Counter()
        recent_user_text = ""
        last_user_action: Optional[str] = None

        for r in rows:
            topics = _extract_topics(r.content or "")
            for t in topics:
                topic_counts[t] += 1

            if r.role == "user":
                recent_user_text = r.content or recent_user_text
                lower = (r.content or "").lower()
                if re.search(r"\b(book|reserve|order|request)\b", lower):
                    last_user_action = "booking"
                elif re.search(r"\b(price|cost|how much|menu)\b", lower):
                    last_user_action = "inquiry"
                elif "schedule" in lower or "what's on" in lower or "whats on" in lower:
                    last_user_action = "schedule"

        # top 2 topics max
        recent_topics = [t for t, _ in topic_counts.most_common(2)]

        preferences = []
        for t in recent_topics:
            p = _TOPIC_TO_PREFERENCES.get(t)
            if p and p not in preferences:
                preferences.append(p)

        return {
            "last_intent": last_intent,
            "last_action": last_user_action,
            "recent_topics": recent_topics,
            "preferences": preferences,
            "recent_user_text": recent_user_text,
            "active_stage": getattr(state, "conversation_stage", None) if state else None,
        }

    finally:
        if owns_db:
            db.close()
