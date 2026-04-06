import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "selam.db")

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables_to_migrate = ["rooms", "feedback", "inventory", "service_requests", "users"]
    
    for table in tables_to_migrate:
        try:
            print(f"Adding property_location to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN property_location VARCHAR DEFAULT 'African Village'")
            print(f"Success for {table}.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column already exists in {table}, skipping.")
            else:
                print(f"Error migrating {table}: {e}")

    # Update existing rows just in case default didn't fully apply to old rows magically
    for table in tables_to_migrate:
        cursor.execute(f"UPDATE {table} SET property_location = 'African Village' WHERE property_location IS NULL")
        print(f"Updated null rows in {table} to 'African Village'.")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
