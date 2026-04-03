from fastapi import APIRouter
from pydantic import BaseModel
from ai.concierge import chat_with_selam, reset_conversation, get_proactive_message

router = APIRouter()


class ChatRequest(BaseModel):
    guest_id: str
    message: str


class ResetRequest(BaseModel):
    guest_id: str


@router.post("/chat")
async def chat(req: ChatRequest):
    reply = await chat_with_selam(req.guest_id, req.message)
    return {"guest_id": req.guest_id, "reply": reply}


@router.get("/proactive/{guest_id}")
async def proactive(guest_id: str):
    """Get a time-aware proactive suggestion for the guest."""
    message = await get_proactive_message(guest_id)
    return {"guest_id": guest_id, "suggestion": message}


@router.post("/reset")
async def reset(req: ResetRequest):
    reset_conversation(req.guest_id)
    return {"status": "conversation reset", "guest_id": req.guest_id}
