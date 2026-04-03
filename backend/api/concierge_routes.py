from fastapi import APIRouter
from pydantic import BaseModel
from ai.concierge import chat_with_selam, reset_conversation

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


@router.post("/reset")
async def reset(req: ResetRequest):
    reset_conversation(req.guest_id)
    return {"status": "conversation reset", "guest_id": req.guest_id}
