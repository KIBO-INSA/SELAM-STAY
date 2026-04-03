import os
import json
import anyio
from datetime import datetime
from google import genai
from google.genai import types
from models.database import SessionLocal, Guest, Room, ServiceRequest, ConversationHistory

# Initialize the Gemini 3 Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", os.getenv("ANTHROPIC_API_KEY")))

# Load Knowledge Base
KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "knowledge.json")
with open(KNOWLEDGE_PATH, "r") as f:
    RESORT_KNOWLEDGE = json.load(f)

# --- AGENT TOOLS ---

def get_resort_knowledge(category: str) -> str:
    """Get information about resort amenities, dining menus, spa services, local attractions, activities, and proactive schedule.
    Valid categories: resort_info, dining, spa_wellness, activities, local_attractions, proactive_schedule
    """
    data = RESORT_KNOWLEDGE.get(category)
    if not data:
        return f"Category '{category}' not found. Valid: resort_info, dining, spa_wellness, activities, local_attractions, proactive_schedule"
    return json.dumps(data, ensure_ascii=False)

def get_guest_stay_details(guest_id: str) -> str:
    """Find out a guest's name, room number, room type, language preference, and stay dates."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        guest = db.query(Guest).filter(Guest.id == gid).first()
        if not guest:
            return "Guest not found."
        room = db.query(Room).filter(Room.id == guest.room_id).first()
        return json.dumps({
            "name": guest.name,
            "room_number": room.room_number if room else "N/A",
            "room_type": room.type if room else "N/A",
            "language": guest.language,
            "check_in": str(guest.check_in),
            "loyalty": "Gold Member"
        })
    finally:
        db.close()

def create_resort_service_request(guest_id: str, category: str, description: str) -> str:
    """Book or request resort services such as Housekeeping, Room Service, Spa, Transport, or Special requests."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        guest = db.query(Guest).filter(Guest.id == gid).first()
        room = db.query(Room).filter(Room.id == guest.room_id).first() if guest else None
        req = ServiceRequest(
            guest_id=gid,
            room_number=room.room_number if room else "N/A",
            category=category,
            description=description,
            status="pending",
            priority="normal"
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return json.dumps({
            "status": "created",
            "request_id": req.id,
            "message": f"Service request #{req.id} created. Staff will attend to it shortly!"
        })
    except Exception as e:
        return f"Error creating request: {str(e)}"
    finally:
        db.close()

def check_service_request_status(guest_id: str) -> str:
    """Check the status of all current service requests for a guest."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        requests = (
            db.query(ServiceRequest)
            .filter(ServiceRequest.guest_id == gid)
            .order_by(ServiceRequest.created_at.desc())
            .limit(5)
            .all()
        )
        if not requests:
            return "No active service requests found."
        results = [{
            "id": r.id,
            "category": r.category,
            "description": r.description,
            "status": r.status,
            "created_at": str(r.created_at)
        } for r in requests]
        return json.dumps(results, ensure_ascii=False)
    finally:
        db.close()

def get_time_aware_suggestion() -> str:
    """Get a context-aware suggestion based on the current time of day at the resort."""
    hour = datetime.now().hour
    schedule = RESORT_KNOWLEDGE.get("proactive_schedule", {})
    
    if 6 <= hour < 9:
        key = "morning_6_to_9"
        period = "Early Morning"
    elif 9 <= hour < 12:
        key = "morning_9_to_12"
        period = "Mid-Morning"
    elif 12 <= hour < 17:
        key = "afternoon_12_to_17"
        period = "Afternoon"
    elif 17 <= hour < 19:
        key = "afternoon_17_to_19"
        period = "Early Evening"
    else:
        key = "evening_19_to_24"
        period = "Evening"

    suggestion = schedule.get(key, "Enjoy your time at the resort!")
    return json.dumps({
        "current_time": datetime.now().strftime("%I:%M %p"),
        "period": period,
        "suggestion": suggestion
    })

# All tools for Automatic Function Calling
TOOLS = [
    get_resort_knowledge,
    get_guest_stay_details,
    create_resort_service_request,
    check_service_request_status,
    get_time_aware_suggestion,
]

SYSTEM_INSTRUCTION = """
You are Selam, the warm and highly intelligent AI Concierge of Selam Stay Resort, Ethiopia.
You are a personal, memory-aware hospitality agent — not a generic chatbot.

CORE RULES:
1. ALWAYS use `get_resort_knowledge` for prices, hours, or details. Never guess or hallucinate.
2. Always start by using `get_guest_stay_details` to personalize. Address guests by name.
3. Use `create_resort_service_request` when a guest asks to order, book, or request anything.
4. Use `check_service_request_status` when a guest asks "what happened to my request?" or "did staff come?"
5. Use `get_time_aware_suggestion` to give proactive recommendations based on time of day.
6. Reference past conversations naturally — you have long-term memory across stays.

MOOD AWARENESS:
- Lazy → suggest spa, in-room dining, rooftop lounge
- Energetic → suggest hiking, kayaking, sunrise yoga
- Hungry → show signature dishes, coffee ceremony
- Explorer → suggest local excursions, hidden gems

TONE: Warm, proud of Ethiopian culture, concise yet personal. Fluent in English and Amharic.
For itineraries, provide structured 3-step timelines. For simple questions, be brief and direct.
"""

# --- Model Configuration (verified against ListModels) ---
PRIMARY_MODEL   = "gemini-3-flash-preview"  # Best, but preview quota
FALLBACK_MODEL  = "gemini-2.5-flash"        # Stable, separate quota
FALLBACK_MODEL2 = "gemini-2.0-flash-lite"   # Lightest, broadest quota

# --- In-Memory Session Store ---
_active_sessions: dict = {}


def _build_chat(guest_id: str, model: str):
    """Build a new SDK chat session loaded with DB history."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        records = (
            db.query(ConversationHistory)
            .filter(ConversationHistory.guest_id == gid)
            .order_by(ConversationHistory.timestamp.asc())
            .limit(20)
            .all()
        )
        history = [
            types.Content(role=r.role, parts=[types.Part(text=r.content)])
            for r in records
        ]
    finally:
        db.close()

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=1.0,
        tools=TOOLS,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(
            disable=False,
            maximum_remote_calls=10
        )
    )
    return client.chats.create(model=model, config=config, history=history)


def _get_or_create_session(guest_id: str):
    """Return existing live SDK chat, or create a fresh one."""
    if guest_id not in _active_sessions:
        _active_sessions[guest_id] = _build_chat(guest_id, PRIMARY_MODEL)
    return _active_sessions[guest_id]


async def chat_with_selam(guest_id: str, user_message: str) -> str:
    """Send a message with automatic retry and model fallback on 503."""
    import time as _time
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        db.add(ConversationHistory(guest_id=gid, role="user", content=user_message))
        db.commit()

        # Attempt chain: preview → 2.0-flash → 1.5-flash
        attempts = [
            (PRIMARY_MODEL,   True),
            (FALLBACK_MODEL,  False),
            (FALLBACK_MODEL2, False),
        ]

        for model, use_existing in attempts:
            try:
                chat = _get_or_create_session(guest_id) if use_existing else _build_chat(guest_id, model)
                if not use_existing:
                    _active_sessions[guest_id] = chat
                    print(f"⚠️ Falling back to {model}")

                response = await anyio.to_thread.run_sync(chat.send_message, user_message)
                reply_text = response.text
                db.add(ConversationHistory(guest_id=gid, role="assistant", content=reply_text))
                db.commit()
                return reply_text

            except Exception as e:
                err = str(e)
                is_transient = any(code in err for code in ["503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED"])
                if is_transient:
                    print(f"⚠️ {model} unavailable ({err[:60]}) — trying next model...")
                    _active_sessions.pop(guest_id, None)
                    await anyio.to_thread.run_sync(lambda: _time.sleep(1))
                    continue
                raise  # non-transient errors bubble up

        return "⚠️ All AI models are currently at capacity. Please try again in a minute!"

    except Exception as e:
        print(f"Agentic Error: {e}")
        return "⚠️ Selam is momentarily unavailable. Please try again!"
    finally:
        db.close()


async def get_proactive_message(guest_id: str) -> str:
    """Generate a time-aware proactive suggestion for the guest."""
    hour = datetime.now().hour
    schedule = RESORT_KNOWLEDGE.get("proactive_schedule", {})

    if 6 <= hour < 9:
        suggestion = schedule.get("morning_6_to_9", "")
        time_str = "Good morning"
    elif 9 <= hour < 12:
        suggestion = schedule.get("morning_9_to_12", "")
        time_str = "Good morning"
    elif 12 <= hour < 17:
        suggestion = schedule.get("afternoon_12_to_17", "")
        time_str = "Good afternoon"
    elif 17 <= hour < 19:
        suggestion = schedule.get("afternoon_17_to_19", "")
        time_str = "Good evening"
    else:
        suggestion = schedule.get("evening_19_to_24", "")
        time_str = "Good evening"

    current_time = datetime.now().strftime("%I:%M %p")
    return f"It's {current_time} — {suggestion}"


def reset_conversation(guest_id: str):
    """Clear in-memory session and DB history for a guest."""
    _active_sessions.pop(guest_id, None)
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        db.query(ConversationHistory).filter(ConversationHistory.guest_id == gid).delete()
        db.commit()
    finally:
        db.close()
