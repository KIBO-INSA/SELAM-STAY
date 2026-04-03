from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from ai.sentiment import analyze_sentiment
from models.database import get_db, Feedback

router = APIRouter()


class FeedbackRequest(BaseModel):
    guest_id: int = 1
    room_number: str = "N/A"
    message: str


@router.post("/analyze")
async def analyze(req: FeedbackRequest, db: Session = Depends(get_db)):
    result = analyze_sentiment(req.message)

    feedback = Feedback(
        guest_id=req.guest_id,
        room_number=req.room_number,
        message=req.message,
        sentiment=result["sentiment"],
        score=result["score"],
        timestamp=datetime.utcnow(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {**result, "id": feedback.id, "message": req.message}


@router.get("/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    """Return unresolved negative feedback for manager dashboard."""
    alerts = db.query(Feedback).filter(
        Feedback.sentiment == "negative",
        Feedback.is_resolved == False
    ).order_by(Feedback.timestamp.desc()).limit(20).all()

    return [
        {
            "id":          a.id,
            "room":        a.room_number,
            "message":     a.message,
            "score":       a.score,
            "timestamp":   a.timestamp.isoformat() if a.timestamp else None,
        }
        for a in alerts
    ]


@router.post("/resolve/{feedback_id}")
async def resolve(feedback_id: int, db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if fb:
        fb.is_resolved = True
        db.commit()
    return {"status": "resolved", "id": feedback_id}


@router.get("/all")
async def get_all(db: Session = Depends(get_db)):
    items = db.query(Feedback).order_by(Feedback.timestamp.desc()).limit(50).all()
    return [
        {
            "id":        i.id,
            "message":   i.message,
            "sentiment": i.sentiment,
            "score":     i.score,
            "room":      i.room_number,
            "resolved":  i.is_resolved,
            "timestamp": i.timestamp.isoformat() if i.timestamp else None,
        }
        for i in items
    ]
