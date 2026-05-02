# Agri-Invest Backend

Spring Boot backend for Agri-Invest. This service is now configured for Render deployment and MongoDB Atlas persistence.

## Required environment variables

Set these in Render for the backend service:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
RAZORPAY_KEY=<your_razorpay_key>
RAZORPAY_SECRET=<your_razorpay_secret>
GEMINI_API_KEY=<your_gemini_key>
CORS_ALLOWED_ORIGINS=https://<your-frontend>.onrender.com
```

If you deploy with the repo root `render.yaml`, the backend derives its internal Flask AI URL automatically from the Flask service host and port. You only need to set `AI_MODULE_URL` manually when deploying the backend outside that Blueprint.

`PORT` is provided automatically by Render and is read by `server.port=${PORT:8080}`.

## Local run

```bash
mvn clean install
mvn spring-boot:run
```

For local development, either provide `MONGODB_URI` or run MongoDB locally on `mongodb://localhost:27017/agri_invest`.
The backend defaults to the local Flask AI service at `http://127.0.0.1:5001/recommend-crop` unless `AI_MODULE_URL` is explicitly set.

## Useful endpoints

- `GET /health`
- `GET /api/health`
- `POST /api/auth/request-otp`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `PUT /api/partner-profiles/{userId}`
- `POST /api/ai/chat`
