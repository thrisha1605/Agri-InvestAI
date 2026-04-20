<<<<<<< HEAD
# 🌱 Agri-Invest AI Platform

## 🚀 Overview
Agri-Invest AI is a full stack web application that provides intelligent agriculture investment insights using machine learning. It helps users make data-driven decisions based on input parameters and trained datasets.

## 🛠 Tech Stack
- Frontend: React (TypeScript)
- Backend: Spring Boot (Java)
- AI Module: Python (Flask)
- Database: MongoDB

## ⚙️ Features
- User-friendly interface for input data
- AI-based prediction and recommendation system
- RESTful API integration
- Scalable full stack architecture

## 🔄 How It Works
1. User enters data through the frontend
2. Backend processes request via Spring Boot
3. AI module (Flask API) analyzes input using trained model
4. Results are returned and displayed to the user

## ▶️ Setup Instructions
1. Clone the repository
2. Run backend (Spring Boot)
3. Run frontend (React)
4. Start Python Flask API

## 📸 Screenshots
(Add screenshots here)

## 🔗 Live Demo
(Add link after deployment)
=======
# Agri-Invest AI

Production-oriented AI modules for:

- crop recommendation
- crop suitability, yield, profit, and risk analysis
- image-based disease detection
- ESG scoring
- water-gap detection and borewell investment planning
- Flask + Spring Boot + React integration

## Structure

```text
ai-models/
datasets/
flask-api/
backend-springboot/
frontend/
```

## Dataset Setup

Use the real datasets described in [datasets/README.md](datasets/README.md):

- Crop recommendation CSV with `N, P, K, temperature, humidity, ph, rainfall, label`
- PlantVillage images for Tomato, Potato, and Corn disease classes

## Train the AI Models

Install Python dependencies:

```powershell
python -m venv .venv-ai
.\.venv-ai\Scripts\Activate.ps1
pip install -r ai-models\requirements.txt
```

Train the crop recommendation model:

```powershell
python ai-models\train_crop_model.py --data datasets\crop-recommendation\Crop_recommendation.csv
```

Train the disease detection model:

```powershell
python ai-models\train_disease_model.py --data datasets\plantvillage
```

Generated outputs:

- `ai-models/artifacts/crop_model.pkl`
- `ai-models/artifacts/crop_metrics.json`
- `ai-models/artifacts/crop_confusion_matrix.png`
- `ai-models/artifacts/disease_model.h5`
- `ai-models/artifacts/disease_labels.json`
- `ai-models/artifacts/disease_metrics.json`
- `ai-models/artifacts/disease_training_curves.png`
- `ai-models/artifacts/disease_confusion_matrix.png`

## Run the Services

Start Flask:

```powershell
.\.venv-ai\Scripts\python.exe flask-api\app.py
```

Start Spring Boot:

```powershell
cd backend-springboot
mvn -s .mvn\settings.xml spring-boot:run
```

Start React:

```powershell
cd frontend
npm install
npm run dev
```

## API Endpoints

Flask:

- `GET /health`
- `POST /recommend-crop`
- `POST /predict-disease`

Spring Boot proxy + analytics:

- `POST /api/ai/crop`
- `POST /api/ai/disease`
- `POST /api/ai/crop-analysis`
- `POST /api/ai/esg-score`
- `POST /api/ai/project-insights`

## Postman Checks

Crop recommendation through Spring:

```http
POST http://localhost:8080/api/ai/crop
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

Crop analysis:

```http
POST http://localhost:8080/api/ai/crop-analysis
Content-Type: application/json

{
  "cropType": "RICE",
  "soilType": "ALLUVIAL",
  "acres": 3,
  "temperature": 27,
  "humidity": 82,
  "rainfall": 1200,
  "ph": 6.4,
  "N": 95,
  "P": 48,
  "K": 50
}
```

ESG score:

```http
POST http://localhost:8080/api/ai/esg-score
Content-Type: application/json

{
  "waterUsage": 150000,
  "fertilizerType": "INTEGRATED",
  "pesticideLevel": "MEDIUM",
  "renewableEnergy": 30,
  "workersEmployed": 5,
  "fairWages": true,
  "communityBenefit": 70,
  "documentsUploaded": 6,
  "transparencyScore": 80,
  "trustScore": 85
}
```

Project insights:

```http
POST http://localhost:8080/api/ai/project-insights
Content-Type: application/json
```

Body: use the same nested `landDetails`, `cropInfo`, `irrigation`, `funding`, and `esg` structure from the farmer project creation flow.

Disease detection through Spring:

- `POST http://localhost:8080/api/ai/disease`
- Body type: `form-data`
- Key: `image`
- Value: upload a Tomato, Potato, or Corn leaf image

## Verified in This Workspace

- React production build: passed
- Spring Boot Maven compile: passed
- Python syntax checks: passed for training scripts and Flask API

## Important Note

The training code and serving integration are complete, but the real model artifacts are not committed in this workspace because the Kaggle datasets were not downloaded inside the sandbox. Run the training commands above after placing the datasets locally to generate the `.pkl`, `.h5`, metrics JSON files, and confusion-matrix/training-curve images.
>>>>>>> 2cdd66ba4c3f8593d7d5dc0d419c53450d2314e0
