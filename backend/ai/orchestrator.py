import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional, Tuple

from models.database import (
    SessionLocal,
    ConversationState,
    Guest,
    Room,
    ServiceRequest,
    Staff,
)

from ai.slots_config import INTENT_SLOTS, INTENT_TO_CATEGORY
from ai.concierge import chat_with_selam
from services.fallback_answer_service import try_answer


STAGES = {"idle", "slot_filling", "confirming", "idle_silent"}


@dataclass
class OrchestratorResult:
    reply: str
    created_request_id: Optional[int] = None


_GREETING_KEYWORDS = {"hi", "hello", "hey", "selam", "good morning", "good afternoon", "good evening"}


def _is_greeting(message: str) -> bool:
    text = (message or "").strip().lower()
    return any(k in text for k in _GREETING_KEYWORDS)


def _looks_like_side_question(message: str) -> bool:
    lower = (message or "").strip().lower()
    if "?" in lower:
        return True
    return any(k in lower for k in [
        "what's on",
        "whats on",
        "schedule",
        "services",
        "price",
        "prices",
        "cost",
        "how much",
        "menu",
        "tibeb",
    ])


def detect_intent(message: str) -> Optional[str]:
    """Keyword-based, single-intent detection."""
    text = (message or "").lower()

    matches = []

    def has_any(*words: str) -> bool:
        return any(w in text for w in words)

    if has_any("towel", "towels"):
        matches.append("towels")

    # Food ordering vs. inquiry
    is_price_inquiry = has_any("price", "prices", "cost", "how much")
    is_order_action = has_any("order", "deliver", "delivery", "bring", "get me", "send", "i want", "i would like", "i'd like")
    mentions_food_context = has_any("food", "hungry", "tibeb", "menu", "dinner", "lunch", "breakfast", "restaurant", "room service")
    mentions_common_food = has_any(
        "pizza", "pizzas", "burger", "burgers", "pasta", "salad", "sandwich", "coffee", "tea", "juice", "water",
        "kitfo", "doro", "shiro", "tibs",
    )
    if is_order_action and not is_price_inquiry:
        # Allow food orders even if the guest doesn't explicitly say "food".
        if mentions_food_context or mentions_common_food or (_parse_quantity(text) is not None):
            matches.append("food_order")

    # "Room service" often implies ordering even without an explicit verb.
    # Avoid starting a workflow for informational questions (e.g., "Room service menu?").
    if has_any("room service") and not is_price_inquiry and "?" not in text:
        matches.append("food_order")

    if has_any(
        "housekeeping",
        "clean",
        "cleaning",
        "refresh room",
        "towels and cleaning",
        "minibar",
        "mini bar",
        "restock",
        "refill",
    ):
        matches.append("housekeeping")

    # Spa booking (requires booking action; avoid triggering on general spa questions)
    if has_any("spa", "massage", "treatment", "sauna", "wellness", "facial"):
        is_booking_action = has_any("book", "reserve", "appointment", "session", "schedule")
        # Also allow common booking phrasing without the explicit word "book".
        seems_like_booking = is_booking_action or has_any("i want", "i would like", "can i get", "need")
        if seems_like_booking or (_parse_time(text) is not None):
            matches.append("spa_booking")

    # Transport requests (airport shuttle, pickup/drop-off, day trips)
    if has_any(
        "transport",
        "shuttle",
        "airport",
        "pickup",
        "pick up",
        "dropoff",
        "drop off",
        "taxi",
        "driver",
        "ride",
        "day trip",
        "daytrip",
    ):
        is_transport_action = has_any("need", "book", "arrange", "schedule", "reserve", "please", "can you", "i want", "i would like")
        is_simple_request = text.strip() in {"transport", "shuttle", "airport shuttle", "airport pickup", "airport drop off", "airport dropoff"}
        # Avoid starting a workflow for informational questions unless it's clearly a request.
        if ("?" in text) and not (is_transport_action or is_simple_request):
            pass
        elif is_transport_action or is_simple_request or (_parse_time(text) is not None):
            matches.append("transport_request")

    if has_any("broken", "not working", "doesn't work", "issue", "problem", "ac", "aircon", "leak", "plumbing", "electric", "light"):
        matches.append("maintenance_request")

    if has_any("late checkout", "late check out", "checkout", "check out", "extend checkout"):
        matches.append("late_checkout")

    # Only allow one intent; if ambiguous, force clarification.
    unique = []
    for m in matches:
        if m not in unique:
            unique.append(m)

    if len(unique) == 1:
        return unique[0]

    if len(unique) > 1:
        # Overlap rule: towels are a common housekeeping sub-request.
        # If both are present, assume the guest wants towel delivery.
        if "towels" in unique and "housekeeping" in unique:
            return "towels"
        return "__ambiguous__"

    return None


_WORD_NUMBERS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}


def _parse_quantity(text: str) -> Optional[int]:
    if not text:
        return None
    m = re.search(r"\b(\d{1,2})\b", text)
    if m:
        return int(m.group(1))
    # word numbers
    lower = text.lower()
    for w, v in _WORD_NUMBERS.items():
        if re.search(rf"\b{re.escape(w)}\b", lower):
            return v
    return None


def _parse_time(text: str) -> Optional[str]:
    """Return a normalized time string like '1:00 PM' or '15:30'."""
    if not text:
        return None
    lower = text.lower().strip()

    # 15:30
    m = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", lower)
    if m:
        hh = int(m.group(1))
        mm = int(m.group(2))
        return f"{hh:02d}:{mm:02d}"

    # 3pm / 3 pm / 3:15 pm
    m = re.search(r"\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b", lower)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        ampm = m.group(3).upper()
        return f"{hour}:{minute:02d} {ampm}"

    # common phrases
    if "now" in lower or "asap" in lower:
        return "ASAP"

    return None


_WEEKDAYS = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def _next_weekday(target_weekday: int, from_date: date) -> date:
    delta = (target_weekday - from_date.weekday()) % 7
    if delta == 0:
        delta = 7
    return from_date + timedelta(days=delta)


def _parse_date(text: str, *, allow_weekday: bool = True) -> Tuple[Optional[str], Optional[str]]:
    """Return (iso_date, error)."""
    if not text:
        return None, "Please provide a date."

    lower = text.strip().lower()
    today = date.today()

    if re.search(r"\btoday\b", lower) or lower in {"tod", "this day"}:
        return today.isoformat(), None
    if re.search(r"\btomorrow\b", lower) or lower in {"tmr", "tmrw"}:
        return (today + timedelta(days=1)).isoformat(), None

    # weekday
    if allow_weekday:
        for name, idx in _WEEKDAYS.items():
            if re.search(rf"\b{name}\b", lower):
                d = _next_weekday(idx, today)
                return d.isoformat(), None

    # ISO date
    m = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", lower)
    if m:
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return d.isoformat(), None
        except Exception:
            return None, "That date format looks invalid."

    # Ambiguous phrases we don't accept
    if "next week" in lower:
        return None, "Please say a specific day (e.g., today/tomorrow/Monday)."

    return None, "Please say a specific day (e.g., today, tomorrow, or Monday)."


def extract_slots(intent: str, message: str) -> dict:
    """Extract slot values from message (best-effort)."""
    text = (message or "").strip()
    lower = text.lower()
    slots = {}

    if intent == "towels":
        q = _parse_quantity(lower)
        if q is not None:
            slots["quantity"] = q
        t = _parse_time(lower)
        if t:
            slots["time"] = t

    elif intent == "housekeeping":
        t = _parse_time(lower)
        if t:
            slots["time"] = t
        # Optional details (keeps the flow minimal while still capturing minibar/cleaning intent).
        if any(k in lower for k in ["minibar", "mini bar", "restock", "refill"]):
            slots["details"] = "minibar"
        elif any(k in lower for k in ["clean", "cleaning", "refresh"]):
            slots["details"] = "cleaning"

    elif intent == "transport_request":
        # date/time
        t = _parse_time(lower)
        if t:
            slots["time"] = t
        d, err = _parse_date(lower, allow_weekday=True)
        if d:
            slots["date"] = d

        # destination
        dest = None
        if "airport" in lower:
            dest = "Airport"
        m = re.search(r"\bto\s+([a-z0-9\s\-']{3,60})", lower)
        if m:
            candidate = m.group(1)
            candidate = re.split(r"\b(at|on|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", candidate)[0]
            candidate = re.sub(r"\s+", " ", candidate).strip(" ,.")
            if len(candidate) >= 3:
                dest = candidate
        if dest:
            slots["destination"] = dest

    elif intent == "maintenance_request":
        # issue_type
        issue = None
        if any(k in lower for k in ["ac", "aircon", "air con"]):
            issue = "AC"
        elif "wifi" in lower:
            issue = "WiFi"
        elif any(k in lower for k in ["leak", "plumbing", "water"]):
            issue = "Plumbing"
        elif any(k in lower for k in ["electric", "power", "light"]):
            issue = "Electrical"
        elif "tv" in lower:
            issue = "TV"
        if issue:
            slots["issue_type"] = issue

        if any(k in lower for k in ["urgent", "asap", "immediately", "emergency"]):
            slots["urgency"] = "urgent"
        elif any(k in lower for k in ["not urgent", "whenever", "no rush"]):
            slots["urgency"] = "normal"

    elif intent == "food_order":
        q = _parse_quantity(lower)
        if q is not None:
            slots["quantity"] = q
        t = _parse_time(lower)
        if t:
            slots["time"] = t

        # item: try to remove obvious parts
        item_text = lower
        item_text = re.sub(r"\b(\d{1,2})\b", " ", item_text)
        item_text = re.sub(r"\b(am|pm)\b", " ", item_text)
        item_text = re.sub(r"\b(order|food|please|i\s+want|i\s+would\s+like|bring|get\s+me|deliver|delivery|send|at|for)\b", " ", item_text)
        item_text = re.sub(r"\b(\d{1,2}):(\d{2})\b", " ", item_text)
        item_text = re.sub(r"\s+", " ", item_text).strip(" ,.")
        # Avoid treating generic phrases as the actual item.
        if item_text in {"room service", "roomservice"}:
            item_text = ""
        if item_text and len(item_text) >= 3:
            slots["item"] = item_text

    elif intent == "spa_booking":
        # minimal
        if any(k in lower for k in ["massage", "scrub", "sauna", "facial"]):
            slots["treatment"] = "massage" if "massage" in lower else "treatment"
        t = _parse_time(lower)
        if t:
            slots["time"] = t
        d, err = _parse_date(lower)
        if d:
            slots["date"] = d

    elif intent == "late_checkout":
        t = _parse_time(lower)
        if t:
            slots["time"] = t
        d, err = _parse_date(lower, allow_weekday=True)
        if d:
            slots["date"] = d

    return slots


def get_next_missing_slot(intent: str, collected: dict) -> Optional[str]:
    required = INTENT_SLOTS.get(intent, [])
    for s in required:
        if s not in (collected or {}) or collected.get(s) in (None, ""):
            return s
    return None


def _slot_prompt(intent: str, slot: str) -> str:
    if intent == "towels" and slot == "quantity":
        return "How many towels would you like?"
    if intent == "towels" and slot == "time":
        return "What time should we bring them? (e.g., 3 PM)"

    if intent == "food_order" and slot == "item":
        return "What would you like to order? (e.g., pizza, burger, salad)"
    if intent == "food_order" and slot == "quantity":
        return "How many would you like?"
    if intent == "food_order" and slot == "time":
        return "What time should we deliver it? (e.g., 7 PM)"

    if intent == "housekeeping" and slot == "time":
        return "What time should housekeeping come? (e.g., 2 PM)"

    if intent == "transport_request" and slot == "destination":
        return "Where should the transport go? (e.g., Airport, Addis Ababa, Day trip to Lake Ziway)"
    if intent == "transport_request" and slot == "date":
        return "Which date? (today/tomorrow/Monday or YYYY-MM-DD)"
    if intent == "transport_request" and slot == "time":
        return "What time do you need pickup? (e.g., 6 AM)"

    if intent == "maintenance_request" and slot == "issue_type":
        return "What’s not working? (e.g., AC, WiFi, plumbing, lights)"
    if intent == "maintenance_request" and slot == "urgency":
        return "How urgent is it? (normal/urgent)"

    if intent == "late_checkout" and slot == "time":
        return "What time would you like to check out (e.g., 1 PM / 3 PM)?"
    if intent == "late_checkout" and slot == "date":
        return "Is that for today or tomorrow?"

    if intent == "spa_booking" and slot == "treatment":
        return "What treatment would you like? (e.g., Deep Tissue Massage, Ethiopian Aromatherapy, Facial)"
    if intent == "spa_booking" and slot == "date":
        return "Which date? (today/tomorrow/Monday or YYYY-MM-DD)"
    if intent == "spa_booking" and slot == "time":
        return "What time would you like? (e.g., 11 AM)"

    if slot == "date":
        return "Which date? (today/tomorrow/Monday or YYYY-MM-DD)"
    if slot == "time":
                    "What would you like to do next? I can help with room service (food delivery), housekeeping (towels/cleaning/minibar), spa booking, transport, maintenance, or late checkout."

    return f"Please provide {slot}."


def _format_slots(intent: str, slots: dict) -> str:
    if intent == "towels":
        return f"{slots.get('quantity')} towels at {slots.get('time')}"
    if intent == "food_order":
        return f"{slots.get('quantity')} × {slots.get('item')} at {slots.get('time')}"
    if intent == "housekeeping":
        details = slots.get("details")
        if details:
            return f"housekeeping ({details}) at {slots.get('time')}"
        return f"housekeeping at {slots.get('time')}"
    if intent == "transport_request":
        return f"transport to {slots.get('destination')} on {slots.get('date')} at {slots.get('time')}"
    if intent == "maintenance_request":
        return f"maintenance: {slots.get('issue_type')} ({slots.get('urgency')})"
    if intent == "late_checkout":
        return f"late checkout until {slots.get('time')} ({slots.get('date')})"
    if intent == "spa_booking":
        return f"spa booking: {slots.get('treatment')} on {slots.get('date')} at {slots.get('time')}"
    return json.dumps(slots, ensure_ascii=False)


def _get_guest_room_number(db, guest_id: str) -> str:
    gid = int(str(guest_id).replace("guest-", ""))
    guest = db.query(Guest).filter(Guest.id == gid).first()
    if not guest or not guest.room_id:
        return "N/A"
    room = db.query(Room).filter(Room.id == guest.room_id).first()
    return room.room_number if room else "N/A"


def _auto_assign_staff(db, service: ServiceRequest) -> Tuple[Optional[int], Optional[str]]:
    """Very small workload-based auto-assignment.

    Picks staff by role when possible, then assigns the one with fewest non-completed requests.
    """
    role_map = {
        "Housekeeping": "Housekeeping",
        "Room Service": "Restaurant",
        "Spa": "Restaurant",  # no spa role in seed; keep simple
        "Maintenance": "Maintenance",
        "Special": "Front Desk",
        "Transport": "Security",
    }
    target_role = role_map.get(service.category, None)

    staff_q = db.query(Staff)
    if target_role:
        staff_q = staff_q.filter(Staff.role == target_role)

    staff_list = staff_q.all()
    if not staff_list:
        staff_list = db.query(Staff).all()

    if not staff_list:
        return None, None

    # workload = count of pending/in_progress requests assigned to staff
    def workload(staff_id: int) -> int:
        return (
            db.query(ServiceRequest)
            .filter(ServiceRequest.assigned_staff_id == staff_id)
            .filter(ServiceRequest.status != "completed")
            .count()
        )

    chosen = min(staff_list, key=lambda s: workload(s.id))
    reason = "assigned due to workload balance + role match" if target_role else "assigned due to workload balance"
    return chosen.id, reason


def _create_service_request(db, guest_id: str, intent: str, slots: dict) -> int:
    gid = int(str(guest_id).replace("guest-", ""))
    room_number = _get_guest_room_number(db, guest_id)
    category = INTENT_TO_CATEGORY.get(intent, "Special")

    if intent == "towels":
        description = f"Fresh towels: {slots.get('quantity')} at {slots.get('time')}"
    elif intent == "food_order":
        description = f"Food order: {slots.get('quantity')} × {slots.get('item')} at {slots.get('time')}"
    elif intent == "housekeeping":
        details = slots.get("details")
        if details:
            description = f"Housekeeping ({details}) at {slots.get('time')}"
        else:
            description = f"Housekeeping at {slots.get('time')}"
    elif intent == "transport_request":
        description = f"Transport to {slots.get('destination')} on {slots.get('date')} at {slots.get('time')}"
    elif intent == "maintenance_request":
        description = f"Maintenance issue: {slots.get('issue_type')} (urgency: {slots.get('urgency')})"
    elif intent == "late_checkout":
        description = f"Late checkout until {slots.get('time')} on {slots.get('date')}"
    elif intent == "spa_booking":
        description = f"Spa booking: {slots.get('treatment')} on {slots.get('date')} at {slots.get('time')}"
    else:
        description = f"Request: {intent} ({json.dumps(slots, ensure_ascii=False)})"

    service = ServiceRequest(
        guest_id=gid,
        room_number=room_number,
        category=category,
        description=description,
        priority="normal",
        status="pending",
        metadata_json=json.dumps(slots or {}, ensure_ascii=False),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    staff_id, reason = _auto_assign_staff(db, service)
    if staff_id:
        service.assigned_staff_id = staff_id
        service.assigned_at = datetime.utcnow()
        service.assignment_reason = reason
        db.commit()

    return service.id


async def handle_guest_message(guest_id: str, message: str, *, db=None) -> OrchestratorResult:
    """Main entry: stateful, event-driven workflow orchestrator."""

    owns_db = db is None
    if owns_db:
        db = SessionLocal()

    try:
        gid = int(str(guest_id).replace("guest-", ""))

        state = db.query(ConversationState).filter(ConversationState.guest_id == gid).first()
        if not state:
            state = ConversationState(guest_id=gid)
            db.add(state)
            db.commit()
            db.refresh(state)

        # Normalize stage
        if state.conversation_stage not in STAGES:
            state.conversation_stage = "idle"

        text = (message or "").strip()
        lower = text.lower()

        # If the guest says "yes" outside a confirmation stage, treat it as a prompt for next action.
        if state.conversation_stage in {"idle", "idle_silent"} and lower in {"yes", "yep", "yeah", "ok", "okay", "sure"}:
            return OrchestratorResult(
                "What would you like to do next? I can help with room service (food delivery), housekeeping (towels/cleaning/minibar), spa booking, transport, maintenance, or late checkout."
            )

        # Global commands
        if lower in {"cancel", "stop", "start over", "reset"}:
            state.active_intent = None
            state.conversation_stage = "idle_silent" if state.greeted else "idle"
            state.set_collected({})
            state.set_pending([])
            state.completion_status = "cancelled"
            state.updated_at = datetime.utcnow()
            db.commit()
            return OrchestratorResult("Okay - cancelled. What would you like to do next?")

        # If in an active workflow, allow side-questions without cancelling the workflow.
        # We only block *starting* a second workflow if the guest hasn't provided any slot value.
        if state.active_intent and state.conversation_stage in {"slot_filling", "confirming"}:
            intent = state.active_intent
            collected = state.get_collected()

            # If this looks like a general question (e.g., schedule/menu/prices), answer it first and
            # DO NOT treat it as slot input (prevents mis-parsing words like 'today' as booking dates).
            if _is_greeting(text):
                next_slot = get_next_missing_slot(intent, collected) or "time"
                return OrchestratorResult(f"Hi again - to continue: {_slot_prompt(intent, next_slot)}")

            if _looks_like_side_question(text) or detect_intent(text) not in {None, intent, "__ambiguous__"}:
                answer = try_answer(text)
                if not answer:
                    answer = await chat_with_selam(guest_id, text, db=db, persist=False)
                next_slot = get_next_missing_slot(intent, collected)
                if state.conversation_stage == "confirming":
                    room = _get_guest_room_number(db, guest_id)
                    follow = f"Please reply yes or no to confirm {_format_slots(intent, collected)} for Room {room}."
                else:
                    follow = _slot_prompt(intent, next_slot) if next_slot else "When you're ready, say 'yes' to confirm."
                return OrchestratorResult(f"{answer}\n\nTo continue your {intent} request: {follow}")

            extracted = extract_slots(intent, text)
            has_new_slot_value = any(
                (v not in (None, "")) and (collected.get(k) != v)
                for k, v in extracted.items()
            )

        # ── Stage: idle / idle_silent ─────────────────────────────────────
        if state.conversation_stage in {"idle", "idle_silent"}:
            # One-time greeting (only when no intent detected)
            if (not state.greeted) and _is_greeting(text):
                state.greeted = True
                state.updated_at = datetime.utcnow()
                db.commit()
                return OrchestratorResult(
                    "Welcome to Kuriftu Resort. I can help with room service (food orders), housekeeping (towels/cleaning/minibar), spa booking, transport, maintenance, and late checkout. What would you like to do?"
                )

            # If we already have context, don't re-run a full greeting loop.
            if state.greeted and _is_greeting(text):
                return OrchestratorResult("Hi again - how can I help?")

            intent = detect_intent(text)
            if intent == "__ambiguous__":
                return OrchestratorResult(
                    "I can help - do you want room service, towels, housekeeping, transport, maintenance, spa booking, or late checkout? (Pick one)"
                )

            if not intent:
                # General question: deterministic fallback first, then Gemini/Concierge
                reply = try_answer(text)
                if not reply:
                    reply = await chat_with_selam(guest_id, text, db=db, persist=False)
                # Mark greeted after first non-workflow chat so we don't spam greetings later
                if not state.greeted:
                    state.greeted = True
                state.updated_at = datetime.utcnow()
                db.commit()
                return OrchestratorResult(reply)

            # Start workflow
            state.active_intent = intent
            state.conversation_stage = "slot_filling"
            state.set_collected({})
            state.set_pending(INTENT_SLOTS.get(intent, []))
            state.completion_status = "in_progress"

            # Try to extract from initial message too
            collected = state.get_collected()
            extracted = extract_slots(intent, text)
            collected.update({k: v for k, v in extracted.items() if v not in (None, "")})
            state.set_collected(collected)

            missing = get_next_missing_slot(intent, collected)
            if missing:
                state.updated_at = datetime.utcnow()
                db.commit()
                return OrchestratorResult(_slot_prompt(intent, missing))

            state.conversation_stage = "confirming"
            state.updated_at = datetime.utcnow()
            db.commit()
            room = _get_guest_room_number(db, guest_id)
            return OrchestratorResult(
                f"Confirm: request {_format_slots(intent, collected)} for Room {room}? (yes/no)"
            )

        # ── Stage: slot_filling ───────────────────────────────────────────
        if state.conversation_stage == "slot_filling":
            intent = state.active_intent
            if not intent:
                state.conversation_stage = "idle"
                db.commit()
                return OrchestratorResult("How can I help?")

            collected = state.get_collected()
            extracted = extract_slots(intent, text)

            # Special handling: if we’re asking for a date and parsing fails, reprompt
            next_slot = get_next_missing_slot(intent, collected)
            if next_slot == "date" and intent == "late_checkout":
                iso, err = _parse_date(text, allow_weekday=True)
                if iso:
                    collected["date"] = iso
                else:
                    return OrchestratorResult(_slot_prompt(intent, "date"))
            else:
                collected.update({k: v for k, v in extracted.items() if v not in (None, "")})

            state.set_collected(collected)
            missing = get_next_missing_slot(intent, collected)
            if missing:
                state.updated_at = datetime.utcnow()
                db.commit()
                return OrchestratorResult(_slot_prompt(intent, missing))

            state.conversation_stage = "confirming"
            state.updated_at = datetime.utcnow()
            db.commit()
            room = _get_guest_room_number(db, guest_id)
            return OrchestratorResult(
                f"Confirm: request {_format_slots(intent, collected)} for Room {room}? (yes/no)"
            )

        # ── Stage: confirming ─────────────────────────────────────────────
        if state.conversation_stage == "confirming":
            intent = state.active_intent
            collected = state.get_collected()

            yes = lower in {"yes", "y", "confirm", "ok", "okay"}
            no = lower in {"no", "n", "nope", "cancel"}

            if not (yes or no):
                return OrchestratorResult("Please reply yes or no.")

            if no:
                # Reset workflow (simple)
                state.conversation_stage = "slot_filling"
                state.set_collected({})
                state.set_pending(INTENT_SLOTS.get(intent, []))
                state.updated_at = datetime.utcnow()
                db.commit()
                first = get_next_missing_slot(intent, {})
                return OrchestratorResult(f"Okay - let's update that. {_slot_prompt(intent, first)}")

            # Execute
            request_id = _create_service_request(db, guest_id, intent, collected)

            state.active_intent = None
            state.conversation_stage = "idle_silent"
            state.set_collected({})
            state.set_pending([])
            state.completion_status = "completed"
            state.updated_at = datetime.utcnow()
            db.commit()

            return OrchestratorResult(
                f"Done - your request is confirmed (Ref #{request_id}). Anything else I can help with?",
                created_request_id=request_id,
            )

        # Fallback
        state.conversation_stage = "idle"
        state.updated_at = datetime.utcnow()
        db.commit()
        return OrchestratorResult("How can I help?")

    finally:
        if owns_db:
            db.close()
