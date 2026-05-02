# Agri-Invest AI

Full-stack agriculture investment platform with:

- React frontend
- Spring Boot backend
- Flask AI service
- MongoDB persistence
- Crop analysis, disease detection, and AI chat

## Project Structure

```text
ai-models/
datasets/
flask-api/
backend-springboot/
frontend/
```

## Main Features

- Crop recommendation using the trained crop model
- Crop suitability, yield, revenue, profit, ESG, and water-gap analysis
- Leaf-image disease detection for supported PlantVillage classes
- Backend-persisted projects, investments, wallets, notifications, and AI outputs
- Backend-persisted AI chat history
- One seeded completed demo project available from the backend

## Run Locally

### 1. Flask AI service

```powershell
python -m venv .venv-ai
.\.venv-ai\Scripts\Activate.ps1
pip install -r flask-api\requirements.txt
python flask-api\app.py
```

Optional Gemini env vars for Flask chat:

```powershell
$env:GEMINI_API_KEY="your_key"
$env:GEMINI_MODEL="gemini-1.5-flash"
```

### 2. Spring Boot backend

```powershell
cd backend-springboot
mvn -s .mvn\settings.xml spring-boot:run
```

Important env vars:

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/agri_invest"
$env:AI_MODULE_URL="http://127.0.0.1:5001/recommend-crop"
```

### 3. React frontend

```powershell
cd frontend
npm install
npm run dev
```

## Deploy On Render

This repo now includes a root `render.yaml` Blueprint for:

- `agri-invest-flask`
- `agri-invest-backend`
- `agri-invest-frontend`

Secrets are expected in Render environment variables instead of committed files.

### Required secrets

- `MONGODB_URI` for the backend
- `GEMINI_API_KEY` for the Flask AI service
- `GEMINI_API_KEY` for the backend chat fallback
- `VITE_API_URL` for the frontend, set to your backend public URL such as `https://<your-backend>.onrender.com`

Atlas note: include the database name in the URI path, for example:

```text
mongodb://<user>:<password>@<host-1>:27017,<host-2>:27017,<host-3>:27017/agri_invest?ssl=true&replicaSet=<replica-set>&authSource=admin&appName=<app-name>
```

### Render deploy flow

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and point it at this repo.
3. Enter the prompted secret values for `MONGODB_URI`, both `GEMINI_API_KEY` entries, and `VITE_API_URL`.
4. After the first deploy, open the frontend URL and verify login, crop analysis, disease detection, and AI chat.

The backend service automatically builds its internal `AI_MODULE_URL` from the Flask service's Render host and port during startup, so you do not need to hardcode that URL in the repo for Render.

## Core API Endpoints

### Flask

- `GET /health`
- `POST /recommend-crop`
- `POST /predict-disease`
- `POST /chat`

### Spring Boot

- `POST /api/ai/crop`
- `POST /api/ai/disease`
- `POST /api/ai/crop-analysis`
- `POST /api/ai/esg-score`
- `POST /api/ai/project-insights`
- `POST /api/ai/chat`
- `GET /api/ai/chat/history`
- `DELETE /api/ai/chat/history`

## Demo Data

The backend seeds:

- demo users for admin, farmer, partner, and investors
- wallet accounts
- a completed grape project with id `demo-completed-vineyard-2026`
- settled investments
- milestone updates

Default seeded password:

```text
AgriDemo123
```

## Notes

- The frontend production build is passing in this workspace.
- The backend compile is passing with `mvn -s .mvn\settings.xml -DskipTests compile`.
- Model artifacts are expected under `ai-models/artifacts/`.
