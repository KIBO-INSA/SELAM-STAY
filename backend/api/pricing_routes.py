from fastapi import APIRouter
from pydantic import BaseModel
from ai.pricing import predict_price

router = APIRouter()


class PricingRequest(BaseModel):
    occupancy: float = 0.75
    base_price: float = 150.0
    days_ahead: int = 7
    is_holiday: int = 0
    competitor_price: float = 180.0


@router.get("/recommend")
async def recommend(
    occupancy: float = 0.75,
    base_price: float = 150.0,
    days_ahead: int = 7,
    is_holiday: int = 0,
    competitor_price: float = 180.0,
):
    return predict_price(occupancy, base_price, days_ahead,
                         is_holiday, competitor_price)


@router.post("/recommend")
async def recommend_post(req: PricingRequest):
    return predict_price(req.occupancy, req.base_price,
                         req.days_ahead, req.is_holiday,
                         req.competitor_price)


@router.get("/simulate")
async def simulate():
    """Return pricing recommendations for all room types."""
    room_types = [
        {"type": "Standard Room",  "base_price": 120.0},
        {"type": "Deluxe Suite",   "base_price": 220.0},
        {"type": "Eco Cabin",      "base_price": 180.0},
        {"type": "Family Room",    "base_price": 160.0},
    ]
    results = []
    for rt in room_types:
        rec = predict_price(
            occupancy=0.78,
            base_price=rt["base_price"],
            days_ahead=3,
            is_holiday=0,
            competitor_price=rt["base_price"] * 1.1
        )
        results.append({"room_type": rt["type"], **rec})
    return results
