from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, ServiceRequest, Staff
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
def get_guest_requests(guest_id: str, db: Session = Depends(get_db)):
    """Get all service requests for a guest."""
    try:
        gid = int(str(guest_id).replace("guest-", ""))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid guest_id")

    requests = db.query(ServiceRequest).filter(
        ServiceRequest.guest_id == gid
    ).order_by(ServiceRequest.created_at.desc()).all()

    staff_by_id = {s.id: s for s in db.query(Staff).all()}

    results = []
    for r in requests:
        staff = staff_by_id.get(r.assigned_staff_id) if r.assigned_staff_id else None
        results.append(
            {
                "id": r.id,
                "category": r.category,
                "description": r.description,
                "status": r.status,
                "priority": r.priority,
                "assigned_at": r.assigned_at.isoformat() if r.assigned_at else None,
                "assignment_reason": r.assignment_reason,
                "assigned_staff": {
                    "id": staff.id,
                    "name": staff.name,
                    "role": staff.role,
                }
                if staff
                else ({"id": r.assigned_staff_id} if r.assigned_staff_id else None),
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
        )
    return results


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


@router.get("/assignments/recent")
def recent_assignments(db: Session = Depends(get_db)):
    """Recent auto-assignments for manager visibility."""
    reqs = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.assigned_staff_id != None)
        .order_by(ServiceRequest.assigned_at.desc())
        .limit(20)
        .all()
    )

    # Preload staff names
    staff_by_id = {s.id: s for s in db.query(Staff).all()}

    results = []
    for r in reqs:
        staff = staff_by_id.get(r.assigned_staff_id)
        results.append({
            "request_id": r.id,
            "category": r.category,
            "status": r.status,
            "assigned_at": r.assigned_at.isoformat() if r.assigned_at else None,
            "reason": r.assignment_reason,
            "staff": {
                "id": staff.id if staff else r.assigned_staff_id,
                "name": staff.name if staff else None,
                "role": staff.role if staff else None,
            },
        })
    return results
