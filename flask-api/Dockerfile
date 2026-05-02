FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PORT=10000
ENV AI_ARTIFACT_DIR=/app/ai-models/artifacts

WORKDIR /app

COPY flask-api/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY flask-api/app.py ./app.py
COPY ai-models/artifacts ./ai-models/artifacts

EXPOSE 10000

CMD ["sh", "-c", "gunicorn --workers 1 --timeout 180 --bind 0.0.0.0:${PORT:-10000} app:app"]
