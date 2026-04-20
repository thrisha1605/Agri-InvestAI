# Agri-Invest Backend (Simple No-Error Version)

This is a simplified Spring Boot backend designed to run cleanly without JPA/WebSocket complexity.

## Run
```bash
mvn clean install
mvn spring-boot:run
```

## Demo endpoints
- GET `/health`
- GET `/api/meta/demo-users`
- POST `/api/auth/request-otp`
- POST `/api/auth/verify-otp`
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/projects`
- POST `/api/projects` with header `X-USER-ID`
- GET `/api/wallet` with header `X-USER-ID`
- POST `/api/wallet/add-money/confirm` with header `X-USER-ID`
- POST `/api/investments` with header `X-USER-ID`

## Notes
- Uses in-memory storage so data resets when the app restarts.
- 4% platform fee is included in settlement preview.
- OTP and payment success are mocked for development.
