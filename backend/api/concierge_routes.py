from fastapi import APIRouter
from pydantic import BaseModel
from ai.concierge import reset_conversation, get_proactive_message
from ai.orchestrator import handle_guest_message, detect_intent

from models.database import SessionLocal, ConversationHistory, ConversationState, ServiceRequest, Staff
from services.context_service import build_context
from services.recommendation_service import get_next_recommendation

router = APIRouter()


class ChatRequest(BaseModel):
    guest_id: str
    message: str


class ResetRequest(BaseModel):
    guest_id: str


@router.get("/history/{guest_id}")
async def history(guest_id: str, limit: int = 30):
    db = SessionLocal()
    try:
        gid = int(str(guest_id).replace("guest-", ""))
        rows = (
            db.query(ConversationHistory)
            .filter(ConversationHistory.guest_id == gid)
            .order_by(ConversationHistory.timestamp.asc())
            .limit(max(1, min(int(limit), 200)))
            .all()
        )
        return {
            "guest_id": guest_id,
            "messages": [
                {
                    "role": r.role,
                    "message": r.content,
                    "intent": getattr(r, "intent", None),
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                }
                for r in rows
            ],
        }
    finally:
        db.close()


@router.post("/chat")
async def chat(req: ChatRequest):
    db = SessionLocal()
    try:
        gid = int(str(req.guest_id).replace("guest-", ""))

        # Intent memory: if user is mid-workflow, treat this as continuation.
        state = db.query(ConversationState).filter(ConversationState.guest_id == gid).first()
        if state and state.active_intent and state.conversation_stage in {"slot_filling", "confirming"}:
            user_intent = state.active_intent
        else:
            user_intent = detect_intent(req.message)
            if user_intent in {None, "__ambiguous__"}:
                user_intent = None

        # 1) Save user message
        db.add(ConversationHistory(guest_id=gid, role="user", content=req.message, intent=user_intent))
        db.commit()

        # 2-4) Run orchestrator (reuses same DB session)
        result = await handle_guest_message(req.guest_id, req.message, db=db)

        assignment = None
        if result.created_request_id:
            sr = db.query(ServiceRequest).filter(ServiceRequest.id == result.created_request_id).first()
            if sr and sr.assigned_staff_id:
                staff = db.query(Staff).filter(Staff.id == sr.assigned_staff_id).first()
                assignment = {
                    "request_id": sr.id,
                    "assigned_at": sr.assigned_at.isoformat() if sr.assigned_at else None,
                    "reason": sr.assignment_reason,
                    "staff": {
                        "id": staff.id if staff else sr.assigned_staff_id,
                        "name": staff.name if staff else None,
                        "role": staff.role if staff else None,
                    },
                }

        # 5) Contextual next-step recommendation (one only)
        context = build_context(req.guest_id, db=db, limit=10)
        recommendation = get_next_recommendation(context)

        # Don't tack on recommendations to simple greetings.
        msg_lower = (req.message or "").strip().lower()
        if msg_lower in {"hi", "hello", "hey", "selam"}:
            recommendation = None

        reply_text = result.reply

        # 6) Save assistant response
        db.add(
            ConversationHistory(
                guest_id=gid,
                role="assistant",
                content=reply_text,
                intent=context.get("last_intent"),
            )
        )
        db.commit()

        return {
            "guest_id": req.guest_id,
            "reply": reply_text,
            "recommendation": recommendation,
            "ref_id": result.created_request_id,
            "assignment": assignment,
        }
    finally:
        db.close()


@router.get("/proactive/{guest_id}")
async def proactive(guest_id: str):
    """Get a time-aware proactive suggestion for the guest."""
    message = await get_proactive_message(guest_id)
    return {"guest_id": guest_id, "suggestion": message}


@router.post("/reset")
async def reset(req: ResetRequest):
    reset_conversation(req.guest_id)
    return {"status": "conversation reset", "guest_id": req.guest_id}
