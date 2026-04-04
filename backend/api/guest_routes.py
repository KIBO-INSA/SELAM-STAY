from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from models.database import get_db, Guest

router = APIRouter()

class PreferencesUpdate(BaseModel):
    guest_id: str
    food: str
    drink: str
    activity: str

@router.post("/preferences")
async def update_preferences(data: PreferencesUpdate, db: Session = Depends(get_db)):
    """Saves the user's AI onboarding preferences to the database permanently."""
    
    # Ideally guest_id is an Int. If the frontend sends "guest-1", we parse it or handle it.
    try:
        gid = int(data.guest_id.replace("guest-", ""))
    except ValueError:
        gid = 1 # Fallback for demo
        
    guest = db.query(Guest).filter(Guest.id == gid).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
        
    prefs_dict = {
        "occasion": data.food,
        "dining_vibe": data.drink,
        "dietary_restrictions": data.activity
    }
    
    guest.preferences = json.dumps(prefs_dict)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    return {"status": "success", "message": "Preferences saved successfully", "preferences": prefs_dict}

@router.get("/{guest_id}")
async def get_guest_profile(guest_id: str, db: Session = Depends(get_db)):
    try:
        gid = int(guest_id.replace("guest-", ""))
    except:
        gid = 1

    guest = db.query(Guest).filter(Guest.id == gid).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    prefs = {}
    if guest.preferences:
        try:
            prefs = json.loads(guest.preferences)
        except:
            pass

    return {
        "id": guest.id,
        "name": guest.name,
        "preferences": prefs
    }
