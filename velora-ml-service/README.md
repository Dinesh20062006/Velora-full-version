# Velora Machine Learning (ML) Microservice (`velora-ml-service`)

Standalone Python FastAPI microservice providing **Predictive Machine Learning Safety Analytics**, Risk Level Classification, and Optimal Safe Travel Window recommendations.

---

## 🚀 Quick Start (Local Run)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the ML Service
```bash
python app/main.py
```
Or using Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Endpoints

### 1. Health Check
`GET http://localhost:8000/`

### 2. Predict Safety Score
`POST http://localhost:8000/api/v1/ml/predict-safety`

**Request Body**:
```json
{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "hourOfDay": 22,
  "nearbyIncidents": 2,
  "nearbySafeZones": 3,
  "lightingDensity": 75.0
}
```

**Response**:
```json
{
  "success": true,
  "message": "ML Safety prediction completed successfully",
  "data": {
    "score": 67.5,
    "incidentProbability": 32.5,
    "level": "MODERATE_RISK",
    "label": "Moderate Risk Zone",
    "color": "#FFC107",
    "recommendation": "Exercise heightened awareness. Stay on well-lit main roads.",
    "optimalWindow": "06:00 AM - 09:30 PM"
  }
}
```

### 3. Predict Route Safety
`POST http://localhost:8000/api/v1/ml/predict-route`

---

