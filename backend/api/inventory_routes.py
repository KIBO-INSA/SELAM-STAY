from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, InventoryItem
from ai.inventory import analyze_inventory_needs
from ai.scheduler import default_forecast # Reuse occupancy forecast
from pydantic import BaseModel

router = APIRouter()

class InventoryUpdate(BaseModel):
    current_stock: float

@router.get("/")
def get_inventory(db: Session = Depends(get_db)):
    items = db.query(InventoryItem).all()
    return items

@router.post("/{item_id}/update")
def update_stock(item_id: int, update: InventoryUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.current_stock = update.current_stock
    db.commit()
    return {"status": "updated", "new_stock": item.current_stock}

@router.get("/optimization")
def get_optimization(db: Session = Depends(get_db)):
    items = db.query(InventoryItem).all()
    # Convert SQLAlchemy models to dicts for the AI function
    items_data = [
        {
            "id": i.id,
            "name": i.name,
            "category": i.category,
            "current_stock": i.current_stock,
            "min_stock_level": i.min_stock_level,
            "unit_measure": i.unit_measure
        }
        for i in items
    ]
    
    forecast = default_forecast()
    alerts = analyze_inventory_needs(items_data, forecast)
    
    return {
        "forecast_occupancy": [round(f, 2) for f in forecast],
        "alerts": alerts
    }
