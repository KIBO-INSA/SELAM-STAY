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


def _build_synthetic_data(n: int = 2000) -> pd.DataFrame:
    np.random.seed(42)
    df = pd.DataFrame({
        "occupancy_rate":     np.random.uniform(0.3, 1.0, n),
        "day_of_week":        np.random.randint(0, 7, n),
        "month":              np.random.randint(1, 13, n),
        "is_holiday":         np.random.randint(0, 2, n),
        "competitor_price":   np.random.uniform(80, 300, n),
        "days_until_checkin": np.random.randint(0, 90, n),
        "base_price":         np.random.uniform(100, 200, n),
    })
    df["optimal_price"] = (
        df["base_price"]
        * (1 + df["occupancy_rate"] * 0.5)
        * (1 + df["is_holiday"] * 0.3)
        * (1 - df["days_until_checkin"] * 0.001)
        * (1 + (df["day_of_week"].isin([4, 5, 6])).astype(int) * 0.15)
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
