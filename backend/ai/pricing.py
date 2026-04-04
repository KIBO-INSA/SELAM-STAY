"""
Dynamic pricing engine using Gradient Boosting.
Trains on synthetic data; replace with real historical bookings in production.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__),
                          "../../ml-models/pricing/pricing_model.pkl")

_model = None


def _build_synthetic_data(n: int = 3000) -> pd.DataFrame:
    """Builds synthetic data representing Kuriftu market trends."""
    np.random.seed(42)
    # Months with major festivals (September=9, January=1) have higher demand
    month = np.random.randint(1, 13, n)
    is_festival_season = np.isin(month, [1, 4, 9, 12]).astype(int)
    
    df = pd.DataFrame({
        "occupancy_rate":     np.random.uniform(0.2, 1.0, n),
        "day_of_week":        np.random.randint(0, 7, n),
        "month":              month,
        "is_holiday":         is_festival_season,
        "competitor_price":   np.random.uniform(120, 450, n),
        "days_until_checkin": np.random.randint(0, 30, n),
        "base_price":         np.random.uniform(150, 250, n),
    })

    # The Logic: 
    # 1. High Occupancy (>80%) = 40% price surge
    # 2. Festival Season = 25% price surge
    # 3. Last minute (<3 days) = 15% 'Urgency' premium
    # 4. Competitor price floor = price must stay within 20% of market avg
    
    df["optimal_price"] = (
        df["base_price"]
        * (1 + (df["occupancy_rate"] > 0.8).astype(int) * 0.4)
        * (1 + df["is_holiday"] * 0.25)
        * (1 + (df["days_until_checkin"] < 3).astype(int) * 0.15)
        + (df["competitor_price"] * 0.1) # Strategic alignment
    )
    return df


def train_pricing_model():
    """Train and save the pricing model."""
    from sklearn.ensemble import GradientBoostingRegressor
    import joblib

    df = _build_synthetic_data()
    features = ["occupancy_rate", "day_of_week", "month",
                "is_holiday", "competitor_price", "days_until_checkin"]
    X, y = df[features], df["optimal_price"]

    model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return model


def _load_model():
    global _model
    if _model is None:
        try:
            import joblib
            _model = joblib.load(MODEL_PATH)
        except Exception:
            _model = train_pricing_model()
    return _model


def predict_price(occupancy: float, base_price: float = 150.0,
                  days_ahead: int = 7, is_holiday: int = 0,
                  competitor_price: float = 180.0) -> dict:
    """Predict optimal room price given current conditions."""
    model = _load_model()
    now = datetime.now()
    features = [[
        occupancy,
        now.weekday(),
        now.month,
        is_holiday,
        competitor_price,
        days_ahead
    ]]
    price = float(model.predict(features)[0])
    change_pct = round((price - base_price) / base_price * 100, 1)

    return {
        "base_price":       round(base_price, 2),
        "recommended_price": round(price, 2),
        "change_percent":   change_pct,
        "direction":        "increase" if change_pct > 0 else "decrease",
        "occupancy_rate":   occupancy,
        "days_ahead":       days_ahead,
    }
