import sqlite3
import os

db_path = 'selam.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Migrating 'rooms' table...")
        cursor.execute("ALTER TABLE rooms ADD COLUMN currency TEXT DEFAULT 'ETB'")
        cursor.execute("ALTER TABLE rooms ADD COLUMN exchange_rate REAL DEFAULT 1.0")
        print("  ✅ 'rooms' updated")
    except sqlite3.OperationalError as e:
        print(f"  ⚠️ 'rooms' migration skipped: {e}")

    try:
        print("Migrating 'inventory' table...")
        cursor.execute("ALTER TABLE inventory ADD COLUMN lead_time_days INTEGER DEFAULT 3")
        print("  ✅ 'inventory' updated")
    except sqlite3.OperationalError as e:
        print(f"  ⚠️ 'inventory' migration skipped: {e}")

    try:
        print("Migrating 'service_requests' table...")
        cursor.execute("ALTER TABLE service_requests ADD COLUMN currency TEXT DEFAULT 'ETB'")
        cursor.execute("ALTER TABLE service_requests ADD COLUMN exchange_rate REAL DEFAULT 1.0")
        print("  ✅ 'service_requests' updated")
    except sqlite3.OperationalError as e:
        print(f"  ⚠️ 'service_requests' migration skipped: {e}")

    try:
        print("Updating existing rows with demo data...")
        cursor.execute("UPDATE rooms SET currency = 'USD', exchange_rate = 115.5 WHERE room_number IN ('101', '201', '301', '401')")
        cursor.execute("UPDATE inventory SET lead_time_days = 1 WHERE name = 'Fresh Injera'")
        cursor.execute("UPDATE inventory SET lead_time_days = 7 WHERE name = 'Bed Linens'")
        print("  ✅ Data updated")
    except sqlite3.OperationalError as e:
        print(f"  ⚠️ Data update skipped: {e}")

    conn.commit()
    conn.close()
    print("🎉 Migration complete!")

if __name__ == "__main__":
    migrate()
