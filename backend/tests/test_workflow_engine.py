import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models.database import Base, Guest, Room, Staff
from ai.orchestrator import handle_guest_message


class WorkflowEngineTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        db = self.Session()
        try:
            # Seed minimal room/guest/staff
            room = Room(id=1, room_number="101", type="Standard Room", base_price=120, current_price=120, is_occupied=True)
            guest = Guest(id=1, name="Test Guest", email="test@example.com", language="en", room_id=1)
            staff = [
                Staff(id=1, name="Staff One", role="Housekeeping", days_off="[]"),
                Staff(id=2, name="Staff Two", role="Maintenance", days_off="[]"),
                Staff(id=3, name="Staff Three", role="Restaurant", days_off="[]"),
            ]
            db.add(room)
            db.add(guest)
            for s in staff:
                db.add(s)
            db.commit()
        finally:
            db.close()

    async def test_towels_flow(self):
        db = self.Session()
        try:
            r1 = await handle_guest_message("guest-1", "I need towels", db=db)
            self.assertIn("How many towels", r1.reply)

            r2 = await handle_guest_message("guest-1", "2", db=db)
            self.assertIn("What time", r2.reply)

            r3 = await handle_guest_message("guest-1", "3 pm", db=db)
            self.assertIn("Confirm:", r3.reply)

            r4 = await handle_guest_message("guest-1", "yes", db=db)
            self.assertIn("Ref #", r4.reply)
            self.assertIsNotNone(r4.created_request_id)
        finally:
            db.close()

    async def test_food_order_flow(self):
        db = self.Session()
        try:
            r1 = await handle_guest_message("guest-1", "I want to order food", db=db)
            self.assertIn("What would you like to order", r1.reply)

            r2 = await handle_guest_message("guest-1", "burger", db=db)
            # quantity OR time next depending on extraction heuristics
            self.assertTrue("How many" in r2.reply or "What time" in r2.reply)

            # drive to confirmation
            await handle_guest_message("guest-1", "2", db=db)
            r3 = await handle_guest_message("guest-1", "7 pm", db=db)
            if "Confirm" not in r3.reply:
                r3 = await handle_guest_message("guest-1", "7 pm", db=db)
            self.assertIn("Confirm:", r3.reply)

            r4 = await handle_guest_message("guest-1", "yes", db=db)
            self.assertIn("Ref #", r4.reply)
        finally:
            db.close()

    async def test_maintenance_flow(self):
        db = self.Session()
        try:
            r1 = await handle_guest_message("guest-1", "AC is broken", db=db)
            # issue_type extracted, should ask urgency
            self.assertTrue("How urgent" in r1.reply or "Confirm" in r1.reply)

            if "How urgent" in r1.reply:
                r2 = await handle_guest_message("guest-1", "urgent", db=db)
                self.assertIn("Confirm:", r2.reply)
                r3 = await handle_guest_message("guest-1", "yes", db=db)
                self.assertIn("Ref #", r3.reply)
            else:
                r2 = await handle_guest_message("guest-1", "yes", db=db)
                self.assertIn("Ref #", r2.reply)
        finally:
            db.close()

    async def test_housekeeping_flow(self):
        db = self.Session()
        try:
            r1 = await handle_guest_message("guest-1", "housekeeping please", db=db)
            self.assertIn("What time", r1.reply)

            r2 = await handle_guest_message("guest-1", "2 pm", db=db)
            self.assertIn("Confirm:", r2.reply)

            r3 = await handle_guest_message("guest-1", "yes", db=db)
            self.assertIn("Ref #", r3.reply)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
