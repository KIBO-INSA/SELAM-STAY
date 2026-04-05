"""
Seed the database with demo data and train ML models.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timedelta
import bcrypt
from models.database import init_db, SessionLocal, Guest, Room, Feedback, MaintenanceLog, Staff, InventoryItem, ServiceRequest, User
from ai.pricing import train_pricing_model
from ai.sentiment import analyze_sentiment

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed():
    print("🌱 Initializing database...")
    init_db()
    db = SessionLocal()

    # --- Rooms ---
    if db.query(Room).count() == 0:
        rooms = [
            Room(room_number="101", type="Standard Room",  base_price=120, current_price=135, is_occupied=True,  currency="USD", exchange_rate=115.5),
            Room(room_number="102", type="Standard Room",  base_price=120, current_price=120, is_occupied=False, currency="ETB", exchange_rate=1.0),
            Room(room_number="201", type="Deluxe Suite",   base_price=220, current_price=265, is_occupied=True,  currency="USD", exchange_rate=115.5),
            Room(room_number="202", type="Deluxe Suite",   base_price=220, current_price=220, is_occupied=False, currency="ETB", exchange_rate=1.0),
            Room(room_number="301", type="Eco Cabin",      base_price=180, current_price=198, is_occupied=True,  currency="USD", exchange_rate=115.5),
            Room(room_number="302", type="Eco Cabin",      base_price=180, current_price=180, is_occupied=True,  currency="ETB", exchange_rate=1.0),
            Room(room_number="401", type="Family Room",    base_price=160, current_price=185, is_occupied=False, currency="USD", exchange_rate=115.5),
            Room(room_number="402", type="Family Room",    base_price=160, current_price=160, is_occupied=True,  currency="ETB", exchange_rate=1.0),
        ]
        db.add_all(rooms)
        print("  ✅ Rooms seeded")

    # --- Legacy cleanup ---
    db.query(Guest).filter(Guest.phone == None).delete(synchronize_session=False)
    db.commit()

    # --- Guests ---
    if db.query(Guest).count() == 0:
        guests = [
            Guest(name="Abebe Girma",    email="abebe@example.com",   phone="+251911234567", password_hash=hash_password("guest123"), language="am", room_number="101", room_id=1,
                  check_in=datetime.utcnow() - timedelta(days=2)),
            Guest(name="Sara Johnson",   email="sara@example.com",    phone="+251922345678", password_hash=hash_password("guest123"), language="en", room_number="201", room_id=3,
                  check_in=datetime.utcnow() - timedelta(days=1)),
            Guest(name="Tigist Haile",   email="tigist@example.com",  phone="+251933456789", password_hash=hash_password("guest123"), language="am", room_number="301", room_id=5,
                  check_in=datetime.utcnow()),
            Guest(name="Michael Brown",  email="michael@example.com", phone="+14155552671",  password_hash=hash_password("guest123"), language="en", room_number="401", room_id=6,
                  check_in=datetime.utcnow() - timedelta(days=3)),
        ]
        db.add_all(guests)
        print("  ✅ Guests seeded")

    # --- Feedback ---
    if db.query(Feedback).count() == 0:
        messages = [
            (1, "101", "The room is absolutely beautiful and the staff are so friendly!"),
            (2, "201", "My AC unit is broken and it's very hot. This is unacceptable!"),
            (3, "301", "The eco cabin experience was amazing. Loved the cultural show."),
            (4, "302", "Room service was slow and the food was cold when it arrived."),
            (1, "101", "Breakfast was wonderful, loved the injera and honey!"),
            (2, "201", "Still no one came to fix the AC. Very disappointed."),
        ]
        for guest_id, room, msg in messages:
            result = analyze_sentiment(msg)
            fb = Feedback(
                guest_id=guest_id,
                room_number=room,
                message=msg,
                sentiment=result["sentiment"],
                score=result["score"],
                timestamp=datetime.utcnow() - timedelta(hours=len(messages))
            )
            db.add(fb)
        print("  ✅ Feedback seeded")

    # --- Maintenance ---
    if db.query(MaintenanceLog).count() == 0:
        equipment_data = [
            ("AC Unit",       480, 95),
            ("Pool Pump",     250, 45),
            ("Generator",     950, 170),
            ("Elevator",      400, 60),
            ("Water Heater",  100, 20),
            ("HVAC System",   620, 110),
            ("Fire Alarm",    0,   300),
        ]
        for name, hours, days_ago in equipment_data:
            log = MaintenanceLog(
                equipment=name,
                usage_hours=hours,
                last_service=datetime.utcnow() - timedelta(days=days_ago),
                risk_score=0.0,
                risk_level="safe"
            )
            db.add(log)
        print("  ✅ Maintenance logs seeded")

    # --- Staff ---
    if db.query(Staff).count() == 0:
        staff_data = [
            ("Dawit Bekele",   "Front Desk",   "[6]"),
            ("Hana Tesfaye",   "Housekeeping", "[0]"),
            ("Yonas Tadesse",  "Restaurant",   "[2]"),
            ("Meron Alemu",    "Security",     "[5]"),
            ("Biruk Haile",    "Maintenance",  "[1]"),
            ("Liya Girma",     "Front Desk",   "[3]"),
            ("Eyob Wolde",     "Housekeeping", "[4]"),
            ("Selam Tekeste",  "Restaurant",   "[6]"),
            ("Natnael Abebe",  "Security",     "[0]"),
            ("Feven Kebede",   "Maintenance",  "[2]"),
        ]
        for name, role, days_off in staff_data:
            db.add(Staff(name=name, role=role, days_off=days_off))
        print("  ✅ Staff seeded")

    # --- Inventory ---
    if db.query(InventoryItem).count() == 0:
        inventory_data = [
            ("Fresh Injera",   "Food",       20.0,  50.0,  "kg",    15.0,  "Local Bakery",       1),
            ("Coffee Beans",   "Food",       15.0,  10.0,  "kg",    45.0,  "Kaffa Highlands",    2),
            ("Bed Linens",     "Linens",     120.0, 100.0, "units", 250.0, "Hotel Supplies Co",  7),
            ("Soap Bars",      "Toiletries", 45.0,  150.0, "units", 5.0,   "CleanStay Ltd",      5),
            ("Disinfectant",   "Cleaning",   8.0,   20.0,  "liters", 12.0,  "EcoClean",           3),
            ("Honey & Spices", "Food",       12.0,  5.0,   "kg",    30.0,  "Local Farm",         2),
        ]
        for name, cat, stock, min_lvl, unit, cost, sup, lead in inventory_data:
            db.add(InventoryItem(
                name=name, category=cat, current_stock=stock, 
                min_stock_level=min_lvl, unit_measure=unit, 
                unit_cost=cost, supplier=sup, lead_time_days=lead
            ))
        print("  ✅ Inventory seeded")
    
    # --- Service Requests ---
    if db.query(ServiceRequest).count() == 0:
        requests = [
            ServiceRequest(guest_id=1, room_number="101", category="Housekeeping", description="Extra towels", priority="low", currency="ETB", exchange_rate=1.0),
            ServiceRequest(guest_id=2, room_number="201", category="Room Service", description="Dinner for two", priority="high", currency="USD", exchange_rate=115.5),
        ]
        db.add_all(requests)
        print("  ✅ Service requests seeded")

    # --- Auth Users (Staff + Manager login accounts) ---
    if db.query(User).count() == 0:
        users = [
            # Staff accounts — identifier = Employee ID
            User(name="Dawit Bekele",  identifier="EMP-01", role="staff",   department="Front Desk",   password_hash=hash_password("staff123")),
            User(name="Hana Tesfaye",  identifier="EMP-02", role="staff",   department="Housekeeping", password_hash=hash_password("staff123")),
            User(name="Yonas Tadesse", identifier="EMP-03", role="staff",   department="Restaurant",   password_hash=hash_password("staff123")),
            User(name="Meron Alemu",   identifier="EMP-04", role="staff",   department="Security",     password_hash=hash_password("staff123")),
            User(name="Biruk Haile",   identifier="EMP-05", role="staff",   department="Maintenance",  password_hash=hash_password("staff123")),
            # Manager accounts — identifier = Admin Code
            User(name="Manager Admin", identifier="ADMIN-01", role="manager", department="Operations", password_hash=hash_password("manager123")),
            User(name="GM Selam",      identifier="ADMIN-02", role="manager", department="General Management", password_hash=hash_password("manager123")),
        ]
        db.add_all(users)
        print("  ✅ Auth users seeded (staff: EMP-01..05 / manager: ADMIN-01..02, password: staff123 / manager123)")

    db.commit()
    db.close()

    # Train pricing model
    print("  🤖 Training pricing model...")
    train_pricing_model()
    print("  ✅ Pricing model trained and saved")

    print("\n🎉 Database seeded successfully! Run: uvicorn main:app --reload")

if __name__ == "__main__":
    seed()
