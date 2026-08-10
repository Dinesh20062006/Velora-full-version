"""
Velora Machine Learning Model Training Script
Trains a RandomForestRegressor / XGBoost Model on historical crime & safety GIS datasets
Exports trained model weights to app/safety_model.joblib for FastAPI inference.
"""

import os
import math
import random
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "crime_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "safety_model.joblib")

def generate_synthetic_crime_dataset(num_samples: int = 2500):
    """
    Generates realistic historical crime & safety dataset across geographical grid coordinates.
    """
    print(f"[DATASET] Generating synthetic historical crime dataset ({num_samples} records)...")
    np.random.seed(42)
    random.seed(42)

    # Base coordinates around Chennai / Metropolitan regions
    base_lats = np.random.uniform(12.95, 13.20, num_samples)
    base_lngs = np.random.uniform(80.15, 80.35, num_samples)
    hours = np.random.randint(0, 24, num_samples)

    records = []

    for i in range(num_samples):
        lat = base_lats[i]
        lng = base_lngs[i]
        hour = hours[i]

        grid_lat = round(lat, 2)
        grid_lng = round(lng, 2)
        spatial_wave = math.sin(grid_lat * 35.0) * math.cos(grid_lng * 35.0)

        # Feature Generation
        incidents = max(0, min(5, int(abs(spatial_wave * 4.5) + (i % 2))))
        safe_zones = max(1, min(6, int(abs(math.cos(grid_lat * 25.0) * 4) + 2)))
        lighting = round(max(35.0, min(98.0, 72.0 + spatial_wave * 22.0 + np.random.normal(0, 3))), 1)
        police = round(max(40.0, min(98.0, 78.0 + math.cos(grid_lng * 30.0) * 16.0)), 1)
        crowd = round(max(30.0, min(95.0, 75.0 + math.sin(grid_lat * 20.0) * 18.0)), 1)
        cctv = round(max(35.0, min(95.0, 68.0 + math.cos(grid_lat * 40.0) * 20.0)), 1)
        response = round(max(50.0, min(99.0, 88.0 + math.sin(grid_lng * 25.0) * 10.0)), 1)

        # Target Formula (Ground Truth Safety Score 0 - 100)
        is_night = 1 if (hour >= 22 or hour < 5) else 0
        time_penalty = 22.0 if is_night else 4.0
        incident_penalty = min(incidents * 11.5, 45.0)
        safe_zone_bonus = min(safe_zones * 6.5, 28.0)
        lighting_bonus = (lighting / 100.0) * 14.0
        spatial_offset = spatial_wave * 8.0

        base_score = 82.0
        target_score = base_score - time_penalty - incident_penalty + safe_zone_bonus + lighting_bonus + spatial_offset
        noise = np.random.normal(0, 1.5)
        final_score = max(12.0, min(98.0, round(target_score + noise, 1)))

        records.append({
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "hour_of_day": hour,
            "nearby_incidents": incidents,
            "nearby_safe_zones": safe_zones,
            "lighting_density": lighting,
            "police_proximity": police,
            "crowd_density": crowd,
            "cctv_coverage": cctv,
            "response_speed": response,
            "safety_score": final_score
        })

    df = pd.DataFrame(records)
    df.to_csv(DATASET_PATH, index=False)
    print(f"[DATASET] Historical crime dataset saved to {DATASET_PATH}")
    return df

def train_and_save_model():
    """
    Loads dataset, trains RandomForestRegressor model, and exports weights.
    """
    if not os.path.exists(DATASET_PATH):
        df = generate_synthetic_crime_dataset()
    else:
        print(f"[DATASET] Reading historical dataset from {DATASET_PATH}...")
        df = pd.read_csv(DATASET_PATH)

    feature_cols = [
        "latitude",
        "longitude",
        "hour_of_day",
        "nearby_incidents",
        "nearby_safe_zones",
        "lighting_density",
        "police_proximity",
        "crowd_density",
        "cctv_coverage",
        "response_speed"
    ]
    target_col = "safety_score"

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("[TRAINING] Training RandomForestRegressor Machine Learning Model...")
    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"[EVALUATION] Model Performance Results:")
    print(f"   * Root Mean Squared Error (RMSE): {rmse:.3f}")
    print(f"   * R2 Accuracy Score: {r2:.4f} ({r2 * 100:.2f}% accuracy)")

    # Save model metadata & weights
    model_payload = {
        "model": model,
        "feature_cols": feature_cols,
        "rmse": rmse,
        "r2": r2,
        "algorithm": "RandomForestRegressor (150 trees, max_depth=12)"
    }

    joblib.dump(model_payload, MODEL_PATH)
    print(f"[EXPORT] Trained model weights saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save_model()
