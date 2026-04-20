from __future__ import annotations

import json
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import joblib
import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = PROJECT_ROOT / "ai-models" / "artifacts"
CROP_MODEL_PATH = ARTIFACT_DIR / "crop_model.pkl"
DISEASE_MODEL_PATH = ARTIFACT_DIR / "disease_model.h5"
DISEASE_LABELS_PATH = ARTIFACT_DIR / "disease_labels.json"
IMAGE_SIZE = (224, 224)
REQUIRED_CROP_FIELDS = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]

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

    @app.get("/health")
    def health():
        return jsonify(
            {
                "service": "agri-invest-flask-ai",
                "cropModelReady": CROP_MODEL_PATH.exists(),
                "diseaseModelReady": DISEASE_MODEL_PATH.exists() and DISEASE_LABELS_PATH.exists(),
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


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
