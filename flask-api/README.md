# Flask AI Service

This service exposes the trained Agri-Invest AI models to Spring Boot and the React frontend.

## Endpoints

- `GET /health`
- `POST /recommend-crop`
- `POST /predict-disease`

## Spring Boot Integration

The Spring backend proxies these Flask endpoints through:

- `POST /api/ai/crop`
- `POST /api/ai/disease`
- `POST /api/ai/crop-analysis`
- `POST /api/ai/esg-score`
- `POST /api/ai/project-insights`

## Run

```powershell
.\.venv-ai\Scripts\python.exe flask-api\app.py
```

The service expects these artifacts to exist:

- `ai-models/artifacts/crop_model.pkl`
- `ai-models/artifacts/disease_model.h5`
- `ai-models/artifacts/disease_labels.json`

Train them first with the scripts under `ai-models/`.

## Quick Postman Smoke Test

Crop recommendation:

```http
POST http://localhost:5001/recommend-crop
Content-Type: application/json

{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 25.4,
  "humidity": 78,
  "rainfall": 180,
  "ph": 6.5
}
```

Disease detection:

- `POST http://localhost:5001/predict-disease`
- Body type: `form-data`
- Key: `image`
