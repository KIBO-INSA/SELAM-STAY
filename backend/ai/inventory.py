"""
Smart Inventory Management AI.
Predicts item consumption based on occupancy levels and stock thresholds.
"""

def analyze_inventory_needs(items: list, occupancy_forecast: list) -> list:
    """
    Analyzes which items need reordering and predicts future stock levels.
    
    Args:
        items: list of dicts with current stock info.
        occupancy_forecast: list of 7 floats (occupancy %) for the coming week.
        
    Returns:
        list of alert dicts for items needing attention.
    """
    alerts = []
    avg_occupancy = sum(occupancy_forecast) / len(occupancy_forecast)
    
    # Consumption multipliers based on item category
    # (Simplified: in reality this would be trained on historical data)
    CONSUMPTION_RATES = {
        "Food":     2.5, # units per 10% occupancy per day
        "Cleaning": 1.2,
        "Linens":   0.5,
        "Toiletries": 3.0,
    }
    
    for item in items:
        rate = CONSUMPTION_RATES.get(item["category"], 1.0)
        
        # Predict 7-day consumption
        # Formula: rate * (avg_occupancy * 10) * 7 days
        predicted_usage = rate * (avg_occupancy * 10) * 7
        predicted_stock_end_of_week = item["current_stock"] - predicted_usage
        
        needs_reorder = predicted_stock_end_of_week <= item["min_stock_level"]
        
        if needs_reorder:
            # Suggest quantity to reach 1.5x the min stock level + weekly usage
            suggested_order = (item["min_stock_level"] * 1.5 + predicted_usage) - item["current_stock"]
            suggested_order = max(0, round(suggested_order, 1))
            
            alerts.append({
                "item_id": item["id"],
                "name": item["name"],
                "current_stock": item["current_stock"],
                "predicted_usage": round(predicted_usage, 1),
                "predicted_stock_7d": round(predicted_stock_end_of_week, 1),
                "min_level": item["min_stock_level"],
                "suggested_order": suggested_order,
                "unit": item["unit_measure"],
                "urgency": "high" if predicted_stock_end_of_week < 0 else "medium"
            })
            
    return alerts
