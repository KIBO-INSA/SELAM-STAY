from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, ServiceRequest
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ServiceRequestCreate(BaseModel):
    guest_id: int
    room_number: str
    category: str  # Room Service, Housekeeping, Spa, Transport, Special
    description: str
    priority: str = "normal"


class ServiceStatusUpdate(BaseModel):
    status: str  # pending, in_progress, completed


@router.post("/request")
def create_service_request(req: ServiceRequestCreate, db: Session = Depends(get_db)):
    """Create a new service request from a guest."""
    service = ServiceRequest(
        guest_id=req.guest_id,
        room_number=req.room_number,
        category=req.category,
        description=req.description,
        priority=req.priority,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return {
        "id": service.id,
        "status": service.status,
        "message": f"Your {service.category} request has been received. We'll attend to it shortly!"
    }


@router.get("/guest/{guest_id}")
def get_guest_requests(guest_id: int, db: Session = Depends(get_db)):
    """Get all service requests for a guest."""
    requests = db.query(ServiceRequest).filter(
        ServiceRequest.guest_id == guest_id
    ).order_by(ServiceRequest.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "category": r.category,
            "description": r.description,
            "status": r.status,
            "priority": r.priority,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in requests
    ]


@router.post("/{request_id}/status")
def update_request_status(request_id: int, update: ServiceStatusUpdate, db: Session = Depends(get_db)):
    """Update the status of a service request (staff use)."""
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    req.status = update.status
    req.updated_at = datetime.utcnow()
    db.commit()

    return {"id": req.id, "status": req.status, "message": "Status updated"}
