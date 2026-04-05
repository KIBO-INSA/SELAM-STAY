"""
Auth routes — Register (guests) and Login (all roles).
POST /api/auth/register  → create guest account, return token
POST /api/auth/login     → verify credentials, return token
GET  /api/auth/me        → return current user from token
"""
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt
from jose import JWTError, jwt

from models.database import get_db, Guest, User

router = APIRouter()

# ── Security config ────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "selam-stay-secret-key-change-in-production")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_DAYS = 30   # stay logged in for 30 days

# ── Helpers ────────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Request / Response schemas ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:         str
    phone:        str
    password:     str
    room_number:  str
    check_in:     str            # ISO date string "YYYY-MM-DD"
    check_out:    str            # ISO date string "YYYY-MM-DD"
    language:     str = "en"
    preferences:  str = "{}"     # JSON string
    special_notes: str = ""

class LoginRequest(BaseModel):
    identifier: str   # phone (guest), emp_id (staff), admin_code (manager)
    password:   str
    role:       str   # "guest" | "staff" | "manager"

# ── Register (guest only) ──────────────────────────────────────────────────────
@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check phone not already used
    existing = db.query(Guest).filter(Guest.phone == req.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered. Please log in."
        )

    try:
        check_in_dt  = datetime.strptime(req.check_in,  "%Y-%m-%d")
        check_out_dt = datetime.strptime(req.check_out, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    guest = Guest(
        name          = req.name,
        phone         = req.phone,
        password_hash = hash_password(req.password),
        room_number   = req.room_number,
        check_in      = check_in_dt,
        check_out     = check_out_dt,
        language      = req.language,
        preferences   = req.preferences,
        special_notes = req.special_notes,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)

    token = create_token({
        "sub":         str(guest.id),
        "role":        "guest",
        "name":        guest.name,
        "room_number": guest.room_number,
        "language":    guest.language,
    })

    return {
        "token":  token,
        "user": {
            "id":          guest.id,
            "name":        guest.name,
            "role":        "guest",
            "room_number": guest.room_number,
            "phone":       guest.phone,
            "language":    guest.language,
            "check_in":    guest.check_in.isoformat() if guest.check_in else None,
            "check_out":   guest.check_out.isoformat() if guest.check_out else None,
            "preferences": guest.preferences,
            "special_notes": guest.special_notes,
        }
    }

# ── Login (all roles) ──────────────────────────────────────────────────────────
@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if req.role == "guest":
        guest = db.query(Guest).filter(Guest.phone == req.identifier).first()
        if not guest or not guest.password_hash:
            raise HTTPException(status_code=401, detail="Phone number not found. Please register first.")
        if not verify_password(req.password, guest.password_hash):
            raise HTTPException(status_code=401, detail="Wrong password. Please try again.")

        token = create_token({
            "sub":         str(guest.id),
            "role":        "guest",
            "name":        guest.name,
            "room_number": guest.room_number,
            "language":    guest.language,
        })
        return {
            "token": token,
            "user": {
                "id":          guest.id,
                "name":        guest.name,
                "role":        "guest",
                "room_number": guest.room_number,
                "phone":       guest.phone,
                "language":    guest.language,
                "check_in":    guest.check_in.isoformat() if guest.check_in else None,
                "check_out":   guest.check_out.isoformat() if guest.check_out else None,
                "preferences": guest.preferences,
                "special_notes": guest.special_notes,
            }
        }

    elif req.role in ("staff", "manager"):
        user = db.query(User).filter(
            User.identifier == req.identifier,
            User.role       == req.role,
            User.is_active  == True
        ).first()
        if not user:
            raise HTTPException(status_code=401, detail="Account not found or inactive.")
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Wrong password. Please try again.")

        token = create_token({
            "sub":        str(user.id),
            "role":       user.role,
            "name":       user.name,
            "department": user.department,
            "property":   user.property_location,
        })
        return {
            "token": token,
            "user": {
                "id":         user.id,
                "name":       user.name,
                "role":       user.role,
                "identifier": user.identifier,
                "department": user.department,
                "property":   user.property_location,
            }
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid role.")

# ── Me (verify token, return user) ────────────────────────────────────────────
@router.get("/me")
def me(authorization: str = "", db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token.")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    role = payload.get("role")
    uid  = payload.get("sub")

    if role == "guest":
        guest = db.query(Guest).filter(Guest.id == int(uid)).first()
        if not guest:
            raise HTTPException(status_code=404, detail="Guest not found.")
        return {
            "id":          guest.id,
            "name":        guest.name,
            "role":        "guest",
            "room_number": guest.room_number,
            "phone":       guest.phone,
            "language":    guest.language,
            "check_in":    guest.check_in.isoformat() if guest.check_in else None,
            "check_out":   guest.check_out.isoformat() if guest.check_out else None,
            "preferences": guest.preferences,
            "special_notes": guest.special_notes,
        }
    elif role in ("staff", "manager"):
        user = db.query(User).filter(User.id == int(uid)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return {
            "id":         user.id,
            "name":       user.name,
            "role":       user.role,
            "identifier": user.identifier,
            "department": user.department,
            "property":   user.property_location,
        }
    raise HTTPException(status_code=400, detail="Invalid token payload.")
