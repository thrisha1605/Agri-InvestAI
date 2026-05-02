from __future__ import annotations

import json
import os
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import joblib
import numpy as np
import requests
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image


APP_DIR = Path(__file__).resolve().parent


def resolve_artifact_dir() -> Path:
    configured_dir = os.getenv("AI_ARTIFACT_DIR", "").strip()
    candidates = []

    if configured_dir:
        candidates.append(Path(configured_dir).expanduser())

    candidates.extend(
        [
            APP_DIR.parent / "ai-models" / "artifacts",
            APP_DIR / "ai-models" / "artifacts",
            APP_DIR / "artifacts",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


ARTIFACT_DIR = resolve_artifact_dir()
CROP_MODEL_PATH = ARTIFACT_DIR / "crop_model.pkl"
DISEASE_MODEL_PATH = ARTIFACT_DIR / "disease_model.h5"
DISEASE_LABELS_PATH = ARTIFACT_DIR / "disease_labels.json"
IMAGE_SIZE = (224, 224)
REQUIRED_CROP_FIELDS = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip() or "gemini-1.5-flash"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

DISEASE_GUIDANCE = {
    "Tomato___Late_blight": {
        "crop": "Tomato",
        "severity": "High",
        "treatment": [
            "Remove heavily infected foliage immediately.",
            "Use a recommended fungicide such as chlorothalonil or mancozeb on schedule.",
            "Avoid leaf wetness by switching to drip irrigation where possible.",
        ],
        "prevention": [
            "Maintain wider spacing for airflow.",
            "Do not irrigate late in the evening.",
            "Rotate away from tomato and potato for at least one season.",
        ],
    },
    "Tomato___Early_blight": {
        "crop": "Tomato",
        "severity": "Medium",
        "treatment": [
            "Prune lower infected leaves and destroy them outside the field.",
            "Apply a copper-based fungicide and monitor spread every 7 to 10 days.",
            "Support plants to reduce soil splash onto foliage.",
        ],
        "prevention": [
            "Use mulch to reduce splash-borne inoculum.",
            "Keep nitrogen balanced to avoid weak foliage.",
        ],
    },
    "Tomato___healthy": {
        "crop": "Tomato",
        "severity": "Low",
        "treatment": [
            "No disease symptoms detected.",
            "Continue routine scouting every 5 to 7 days.",
        ],
        "prevention": [
            "Maintain balanced nutrition and sanitation.",
        ],
    },
    "Potato___Late_blight": {
        "crop": "Potato",
        "severity": "High",
        "treatment": [
            "Destroy infected haulms and avoid moving plant debris between plots.",
            "Apply a systemic fungicide program immediately.",
            "Improve drainage and reduce prolonged leaf wetness.",
        ],
        "prevention": [
            "Use certified seed tubers and tolerant varieties when available.",
        ],
    },
    "Potato___Early_blight": {
        "crop": "Potato",
        "severity": "Medium",
        "treatment": [
            "Apply protectant fungicide and remove badly infected leaves.",
            "Support potassium nutrition for canopy resilience.",
        ],
        "prevention": [
            "Rotate crops and avoid continuous solanaceous planting.",
        ],
    },
    "Potato___healthy": {
        "crop": "Potato",
        "severity": "Low",
        "treatment": [
            "No disease symptoms detected.",
        ],
        "prevention": [
            "Continue preventive scouting and field hygiene.",
        ],
    },
    "Corn_(maize)___Common_rust_": {
        "crop": "Corn",
        "severity": "Medium",
        "treatment": [
            "Apply a triazole or strobilurin fungicide if disease pressure is increasing.",
            "Track infection in younger leaves to estimate spread risk.",
        ],
        "prevention": [
            "Use tolerant hybrids and avoid dense canopy humidity pockets.",
        ],
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "crop": "Corn",
        "severity": "High",
        "treatment": [
            "Apply a labeled fungicide at the early lesion stage.",
            "Remove residue from heavily infected previous crops where feasible.",
        ],
        "prevention": [
            "Rotate with non-host crops and select resistant hybrids.",
        ],
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "crop": "Corn",
        "severity": "Medium",
        "treatment": [
            "Use foliar fungicide where lesions are expanding rapidly.",
            "Reduce overhead irrigation that keeps leaves wet for long periods.",
        ],
        "prevention": [
            "Improve air movement and residue management.",
        ],
    },
    "Corn_(maize)___healthy": {
        "crop": "Corn",
        "severity": "Low",
        "treatment": [
            "No disease symptoms detected.",
        ],
        "prevention": [
            "Continue scouting through the next growth stage.",
        ],
    },
}


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # MOVED HOME ROUTE INSIDE HERE
    @app.route('/')
    def home():
        return "AI Engine is Running"

    @app.get("/health")
    def health():
        return jsonify(
            {
                "service": "agri-invest-flask-ai",
                "cropModelReady": CROP_MODEL_PATH.exists(),
                "diseaseModelReady": DISEASE_MODEL_PATH.exists() and DISEASE_LABELS_PATH.exists(),
                "geminiReady": bool(GEMINI_API_KEY),
            }
        )

    @app.post("/chat")
    def chat():
        payload = request.get_json(silent=True) or {}

        try:
            reply = generate_chat_reply(payload)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except RuntimeError as exc:
            return jsonify({"error": str(exc)}), 503

        return jsonify(
            {
                "reply": reply,
                "provider": "flask-gemini",
            }
        )

    @app.post("/recommend-crop")
    def recommend_crop():
        payload = request.get_json(silent=True) or {}
        missing_fields = [field for field in REQUIRED_CROP_FIELDS if field not in payload]
        if missing_fields:
            return jsonify({"error": f"Missing crop input fields: {missing_fields}"}), 400

        try:
            model_artifact = load_crop_model()
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 503

        features = np.array(
            [
                [
                    float(payload["N"]),
                    float(payload["P"]),
                    float(payload["K"]),
                    float(payload["temperature"]),
                    float(payload["humidity"]),
                    float(payload["rainfall"]),
                    float(payload["ph"]),
                ]
            ],
            dtype=np.float32,
        )

        model = model_artifact["model"]
        classes = model_artifact["classes"]
        probabilities = model.predict_proba(features)[0]
        predicted_index = int(np.argmax(probabilities))
        recommended_crop = str(classes[predicted_index])
        ranked = sorted(
            (
                {
                    "crop": str(label),
                    "confidence": round(float(probability) * 100, 2),
                }
                for label, probability in zip(classes, probabilities, strict=True)
            ),
            key=lambda item: item["confidence"],
            reverse=True,
        )

        return jsonify(
            {
                "crop": recommended_crop,
                "recommendedCrop": recommended_crop,
                "confidence": round(float(probabilities[predicted_index]) * 100, 2),
                "topPredictions": ranked[:3],
            }
        )

    @app.post("/predict-disease")
    def predict_disease():
        image_file = request.files.get("image")
        if image_file is None or not image_file.filename:
            return jsonify({"error": "Please upload an image using the 'image' form field."}), 400

        try:
            model = load_disease_model()
            labels = load_disease_labels()
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 503

        image_tensor = preprocess_leaf_image(image_file.read())
        probabilities = model.predict(np.expand_dims(image_tensor, axis=0), verbose=0)[0]
        predicted_index = int(np.argmax(probabilities))
        raw_label = labels[predicted_index]
        confidence = round(float(probabilities[predicted_index]) * 100, 2)
        guidance = DISEASE_GUIDANCE.get(raw_label, default_guidance(raw_label))

        ranked = sorted(
            (
                {
                    "label": to_readable_label(label),
                    "rawLabel": label,
                    "confidence": round(float(probability) * 100, 2),
                }
                for label, probability in zip(labels, probabilities, strict=True)
            ),
            key=lambda item: item["confidence"],
            reverse=True,
        )

        return jsonify(
            {
                "disease": to_readable_label(raw_label),
                "rawLabel": raw_label,
                "confidence": confidence,
                "crop": guidance["crop"],
                "severity": guidance["severity"],
                "treatment": guidance["treatment"],
                "prevention": guidance["prevention"],
                "topPredictions": ranked[:3],
            }
        )

    return app


@lru_cache(maxsize=1)
def load_crop_model():
    if not CROP_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Crop model artifact not found at {CROP_MODEL_PATH}. Train ai-models/train_crop_model.py first."
        )
    return joblib.load(CROP_MODEL_PATH)


@lru_cache(maxsize=1)
def load_disease_model():
    if not DISEASE_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Disease model artifact not found at {DISEASE_MODEL_PATH}. Train ai-models/train_disease_model.py first."
        )
    return tf.keras.models.load_model(DISEASE_MODEL_PATH)


@lru_cache(maxsize=1)
def load_disease_labels():
    if not DISEASE_LABELS_PATH.exists():
        raise FileNotFoundError(
            f"Disease label metadata not found at {DISEASE_LABELS_PATH}. Train ai-models/train_disease_model.py first."
        )
    return json.loads(DISEASE_LABELS_PATH.read_text(encoding="utf-8"))


def preprocess_leaf_image(image_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMAGE_SIZE)
    image_array = np.asarray(image, dtype=np.float32)
    return tf.keras.applications.mobilenet_v2.preprocess_input(image_array)


def to_readable_label(raw_label: str) -> str:
    return raw_label.replace("___", " - ").replace("_", " ")


def default_guidance(raw_label: str) -> dict[str, object]:
    crop = raw_label.split("___", maxsplit=1)[0].replace("Corn_(maize)", "Corn")
    return {
        "crop": crop,
        "severity": "Medium",
        "treatment": [
            "Inspect the field manually to confirm visible symptoms.",
            "Consult a local agronomist before pesticide application.",
        ],
        "prevention": [
            "Maintain crop hygiene, balanced nutrition, and weekly scouting.",
        ],
    }


def generate_chat_reply(payload: dict[str, object]) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("Gemini API key is not configured for the Flask AI service.")

    message = safe_text(payload.get("message"))
    image = safe_text(payload.get("image"))
    if not message and not image:
        raise ValueError("Message or image input is required for chat.")

    try:
        response = requests.post(
            GEMINI_API_URL.format(model=normalize_model(GEMINI_MODEL)),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            json=build_chat_payload(payload),
            timeout=90,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Gemini chat request failed: {exc}") from exc

    reply = extract_chat_reply(response.json())
    if not reply:
        raise RuntimeError("Gemini returned an empty chat response.")
    return reply


def build_chat_payload(payload: dict[str, object]) -> dict[str, object]:
    return {
        "system_instruction": {
            "parts": [
                {
                    "text": build_chat_system_instruction(payload),
                }
            ]
        },
        "contents": build_chat_contents(payload),
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 900,
        },
    }


def build_chat_contents(payload: dict[str, object]) -> list[dict[str, object]]:
    contents: list[dict[str, object]] = []
    history = payload.get("history")

    if isinstance(history, list):
        for turn in history[-10:]:
            if not isinstance(turn, dict):
                continue

            text = safe_text(turn.get("text"))
            if not text:
                continue

            sender = safe_text(turn.get("sender")).lower()
            contents.append(
                {
                    "role": "model" if sender == "ai" else "user",
                    "parts": [{"text": text}],
                }
            )

    parts = build_current_user_parts(payload)
    if parts:
        contents.append(
            {
                "role": "user",
                "parts": parts,
            }
        )

    return contents


def build_current_user_parts(payload: dict[str, object]) -> list[dict[str, object]]:
    parts: list[dict[str, object]] = []
    message = safe_text(payload.get("message"))
    image = safe_text(payload.get("image"))

    if not message and image:
        message = "Analyze this image and answer the user's request clearly and practically."

    if message:
        parts.append({"text": message})

    image_part = build_image_part(image)
    if image_part is not None:
        parts.append(image_part)

    return parts


def build_image_part(image_data: str) -> dict[str, object] | None:
    if not image_data or "," not in image_data:
        return None

    metadata, base64_data = image_data.split(",", 1)
    encoded = safe_text(base64_data)
    if not encoded:
        return None

    return {
        "inlineData": {
            "mimeType": extract_mime_type(metadata),
            "data": encoded,
        }
    }


def extract_chat_reply(payload: dict[str, object]) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ""

    first_candidate = candidates[0]
    if not isinstance(first_candidate, dict):
        return ""

    content = first_candidate.get("content")
    if not isinstance(content, dict):
        return ""

    parts = content.get("parts")
    if not isinstance(parts, list):
        return ""

    reply_parts: list[str] = []
    for part in parts:
        if isinstance(part, dict) and part.get("text") is not None:
            reply_parts.append(str(part.get("text")))

    return "".join(reply_parts).strip()


def build_chat_system_instruction(payload: dict[str, object]) -> str:
    lines = [
        "You are Agri-Invest AI, a warm real-time assistant inside an Indian agriculture platform.",
        "Answer naturally like a capable Gemini-style assistant, not like a rigid FAQ bot.",
        "Handle general questions as well as agriculture, investments, project workflow, ROI, and disease guidance.",
        "Be practical, clear, and helpful. Use short paragraphs or bullets when useful.",
        "If details are missing, ask one short follow-up question instead of guessing.",
        "If the user shares an image, describe visible details carefully and mention uncertainty honestly.",
    ]

    role = safe_text(payload.get("role")).upper()
    if role:
        lines.append(f"Current user role: {role}.")

    user_name = safe_text(payload.get("userName"))
    if user_name:
        lines.append(f"Current user name: {user_name}.")

    return "\n".join(lines)


def normalize_model(model_name: str) -> str:
    normalized = safe_text(model_name)
    if normalized.startswith("models/"):
        return normalized.removeprefix("models/")
    return normalized or "gemini-1.5-flash"


def extract_mime_type(metadata: str) -> str:
    lowered = safe_text(metadata).lower()
    start_index = lowered.find(":")
    end_index = lowered.find(";")
    if start_index >= 0 and end_index > start_index:
        mime_type = lowered[start_index + 1 : end_index].strip()
        if mime_type:
            return mime_type
    return "image/jpeg"


def safe_text(value: object) -> str:
    return "" if value is None else str(value).strip()


# CREATE THE APP INSTANCE
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")))
