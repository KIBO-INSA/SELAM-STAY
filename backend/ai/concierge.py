import os
import json
import anyio
from datetime import datetime
from models.database import SessionLocal, Guest, Room, ServiceRequest, ConversationHistory
from services.fallback_answer_service import try_answer

try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover
    genai = None
    types = None

# Gemini client is initialized lazily.
# IMPORTANT: Do not create the client at import time, because missing keys should not crash the API.
_client = None


def _get_client():
    global _client
    if _client is False:
        return None
    if _client is not None:
        return _client

    if genai is None:
        _client = False
        return None

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        _client = False
        return None

    try:
        _client = genai.Client(api_key=api_key)
        return _client
    except Exception:
        _client = False
        return None

# Load Knowledge Bases
KNOWLEDGE_PATH = os.path.join(os.path.dirname(__file__), "knowledge.json")
KURIFTU_PATH = os.path.join(os.path.dirname(__file__), "kuriftu_knowledge.json")

with open(KNOWLEDGE_PATH, "r") as f:
    RESORT_KNOWLEDGE = json.load(f)
with open(KURIFTU_PATH, "r") as f:
    KURIFTU_VILLAS = json.load(f)

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
            "loyalty": "Gold Member",
            "preferences": json.loads(guest.preferences) if guest.preferences else {}
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
        
        # 1. Generate AI Personalization Recommendation
        # Since this is a synchronous tool called by the SDK, we use anyio to run the async helper
        try:
            import anyio
            staff_rec = anyio.run(generate_staff_recommendation, db, gid, category, description)
        except Exception:
            staff_rec = "Connect warmly using the guest's name during service delivery."

        req = ServiceRequest(
            guest_id=gid,
            room_number=room.room_number if room else "N/A",
            category=category,
            description=description,
            status="pending",
            priority="normal",
            staff_recommendation=staff_rec
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

def get_personalized_recommendations(guest_id: str) -> str:
    """Analyze guest preferences and history to suggest high-value resort experiences (Spa, Private Dining, Tours)."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        guest = db.query(Guest).filter(Guest.id == gid).first()
        if not guest: return "Guest not found."

        # Parse structured JSON preferences saved from the AI Onboarding form
        prefs = {}
        if guest.preferences:
            try:
                prefs = json.loads(guest.preferences)
            except Exception:
                prefs = {}

        occasion = prefs.get("occasion", "").lower()
        dining_vibe = prefs.get("dining_vibe", "").lower()
        dietary = prefs.get("dietary_restrictions", "").strip()

        recommendations = []

        # --- Occasion-based recommendations ---
        if occasion == "leisure":
            recommendations.append({
                "service": "Signature Ethiopian Coffee Scrub + Full Body Wrap",
                "category": "Spa & Wellness",
                "price": "ETB 5,500",
                "why": "You are here for deep relaxation. This is our highest-rated wellness treatment."
            })
        elif occasion == "honeymoon":
            recommendations.append({
                "service": "Private Lakeside Candle Dinner for Two",
                "category": "Romantic Dining",
                "price": "ETB 15,000",
                "why": "A carefully curated experience for couples — secluded, intimate, and unforgettable."
            })
            recommendations.append({
                "service": "Couples Rose Petal Spa Ritual",
                "category": "Spa",
                "price": "ETB 9,000",
                "why": "Our signature honeymoon treatment with champagne and aromatherapy."
            })
        elif occasion == "family":
            recommendations.append({
                "service": "Kuriftu Water Park Full-Day Pass (Family of 4)",
                "category": "Family Activities",
                "price": "ETB 6,000",
                "why": "The kids will love it. Our most popular family activity."
            })
            recommendations.append({
                "service": "Ethiopian Cultural Cooking Class",
                "category": "Family Experience",
                "price": "ETB 3,500",
                "why": "A hands-on cultural immersion experience the whole family can enjoy together."
            })
        elif occasion == "business":
            recommendations.append({
                "service": "Executive Meeting Room & Catering (Full Day)",
                "category": "Business",
                "price": "ETB 12,000",
                "why": "Our premium workspace with fast Wi-Fi, projector, and included catering."
            })

        # --- Dining vibe based recommendations ---
        if dining_vibe == "cultural":
            recommendations.append({
                "service": "Ethiopian Coffee Ceremony & Traditional Injera Feast",
                "category": "Cultural Dining",
                "price": "ETB 2,500",
                "why": "You expressed interest in cultural immersion. This is the most authentic experience we offer."
            })
        elif dining_vibe == "premium":
            recommendations.append({
                "service": "1963 Restaurant – Chef's Tasting Menu",
                "category": "Fine Dining",
                "price": "ETB 8,500",
                "why": "Our premium multi-course experience — matched to your dining preference."
            })

        # --- Dietary safety note ---
        if dietary:
            return json.dumps({
                "dietary_flag": f"IMPORTANT: Guest has reported dietary restrictions: '{dietary}'. All recommendations above must be pre-screened with the kitchen.",
                "recommendations": recommendations if recommendations else [{"service": "Chef Consultation", "category": "Safety", "price": "Complimentary", "why": f"Personalized menu created to match your dietary needs: {dietary}."}]
            }, ensure_ascii=False)

        if not recommendations:
            recommendations.append({
                "service": "Resort Signature Experience Package",
                "category": "Premium",
                "price": "ETB 8,500",
                "why": "Our most popular all-in-one luxury experience."
            })

        return json.dumps({"recommendations": recommendations}, ensure_ascii=False)
    finally:
        db.close()

def book_spa_service(guest_id: str, treatment: str, time: str) -> str:
    """Book a professional spa treatment or wellness session."""
    return create_resort_service_request(guest_id, "Spa", f"{treatment} scheduled for {time}")

def reserve_dining_table(guest_id: str, restaurant: str, party_size: int, time: str) -> str:
    """Reserve a table at a resort restaurant like 1963 or Tibeb."""
    return create_resort_service_request(guest_id, "Dining", f"Table for {party_size} at {restaurant} reserved for {time}")

def request_resort_maintenance(guest_id: str, item: str, urgency: str) -> str:
    """Report a maintenance issue in the villa (e.g., AC, lighting, plumbing)."""
    return create_resort_service_request(guest_id, "Maintenance", f"Urgent {urgency} repair requested for {item}")

def get_villa_cultural_context(guest_id: str) -> str:
    """Get the specific country-theme, artifacts, cuisine, and history of the guest's villa at Kuriftu African Village."""
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        guest = db.query(Guest).filter(Guest.id == gid).first()
        if not guest: return "Guest not found."
        room_id = guest.room_id or 1
        villa = next((v for v in KURIFTU_VILLAS["villas"] if v["id"] == room_id), KURIFTU_VILLAS["villas"][0])
        return json.dumps({
            "villa_id": room_id, "country": villa["country"], "region": villa["region"],
            "artifacts_in_room": villa["artifacts"], "suggested_heritage_cuisine": villa["cuisine"],
            "the_story": villa["story"]
        }, ensure_ascii=False)
    finally:
        db.close()

# All tools for Automatic Function Calling
TOOLS = [
    request_resort_maintenance,
    get_villa_cultural_context,
    book_spa_service,
    reserve_dining_table,
]

# --- Internal AI Helpers ---

async def generate_staff_recommendation(db, guest_id: int, category: str, description: str) -> str:
    """Internal helper to generate a staff personalization note via Gemini."""
    client = _get_client()
    if not client:
        return "Standard service execution recommended."

    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        return "Connect warmly using the guest's name during service delivery."

    prefs = json.loads(guest.preferences or "{}")
    lang = guest.language or "en"
    
    prompt = f"""
    Service Request for Guest: {guest.name}
    Category: {category}
    Description: {description}
    Guest Preferences: {json.dumps(prefs)}
    Guest Language: {lang}

    As the elite Selam AI Concierge, write a ONE-SENTENCE strategic instruction for the staff member handling this request.
    The instruction should tell them how to personalize the service or what subtle detail to include based on the guest's background/preferences to 'wow' them.
    Keep it professional, high-performance, and actionable.
    """

    try:
        import anyio
        response = await anyio.to_thread.run_sync(
            client.models.generate_content,
            model=PRIMARY_MODEL,
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating staff rec: {e}")
        return "Connect warmly using the guest's name during service delivery."

SYSTEM_INSTRUCTION = """
You are Selam, the elite High-Performance Concierge for Kuriftu Resort & Spa. 
Your primary purpose is to drive resort revenue and provide effortless utility to our guests through bookings, requests, and intelligent planning.

CORE MISSION:
1. SERVICE & BOOKING: Use `book_spa_service`, `reserve_dining_table`, and `request_resort_maintenance` as your primary tools. Your goal is to make every guest request feel resolved instantly.
2. REVENUE ORIENTED: When a guest is "Lazy" or "Hungry," proactively recommend paid services (Spa, Private Dining) using `get_personalized_recommendations`.
3. VILLA AWARE: Always acknowledge the guest's villa theme (`get_villa_cultural_context`) to make your service feel personalized.
4. PLANNING: Act as a master itinerary planner. Coordinate their day from dawn until dusk.

TONE: World-class, efficient, proactive, and highly professional. You are the digital heart of Kuriftu operations.
"""

# --- Model Configuration (verified against ListModels) ---
PRIMARY_MODEL   = "gemini-3-flash-preview"  # Best, but preview quota
FALLBACK_MODEL  = "gemini-2.5-flash"        # Stable, separate quota
FALLBACK_MODEL2 = "gemini-2.0-flash-lite"   # Lightest, broadest quota

# --- In-Memory Session Store ---
_active_sessions: dict = {}


def _deterministic_fallback(user_message: str) -> str:
    answer = try_answer(user_message or "")
    if answer:
        return answer
    return (
        "I can help with towels, food delivery, housekeeping, maintenance, spa booking, late checkout, and today's schedule. "
        "Tell me what you need (for example: 'Deliver 2 pizzas at 7 PM' or 'Book a massage tomorrow at 11 AM')."
    )


def _build_chat(guest_id: str, model: str):
    """Build a new SDK chat session loaded with DB history."""
    client = _get_client()
    if client is None:
        return None

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


async def chat_with_selam(guest_id: str, user_message: str, *, db=None, persist: bool = True) -> str:
    """Send a message with automatic retry and model fallback on 503."""
    import time as _time

    # If Gemini isn't configured/available, always return a deterministic fallback.
    if _get_client() is None:
        return _deterministic_fallback(user_message)

    owns_db = db is None
    if owns_db:
        db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))

        if persist:
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
                if chat is None:
                    return "⚠️ Selam AI is not available right now. I can still help with service requests (towels, food orders, housekeeping, maintenance, spa booking, late checkout)."
                if not use_existing:
                    _active_sessions[guest_id] = chat
                    print(f"⚠️ Falling back to {model}")

                try:
                    with anyio.fail_after(15):
                        response = await anyio.to_thread.run_sync(
                            chat.send_message,
                            user_message,
                            cancellable=True,
                        )
                except TimeoutError:
                    print(f"Agentic timeout calling {model}")
                    return _deterministic_fallback(user_message)
                reply_text = response.text
                if persist:
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
                # Non-transient errors: fall back to deterministic behavior instead of failing.
                print(f"Agentic non-transient error: {err[:120]}")
                return _deterministic_fallback(user_message)

        return _deterministic_fallback(user_message)

    except Exception as e:
        print(f"Agentic Error: {e}")
        return _deterministic_fallback(user_message)
    finally:
        if owns_db:
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
    """Clear in-memory session, DB history, and active conversation state for a guest."""
    _active_sessions.pop(guest_id, None)
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        # 1. Clear message history
        db.query(ConversationHistory).filter(ConversationHistory.guest_id == gid).delete()
        # 2. Reset orchestration state
        db.query(ConversationState).filter(ConversationState.guest_id == gid).delete()
        db.commit()
    finally:
        db.close()
