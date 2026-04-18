from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt  # import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = PROJECT_ROOT / "datasets" / "crop-recommendation" / "Crop_recommendation.csv"
ARTIFACT_DIR = PROJECT_ROOT / "ai-models" / "artifacts"

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]
TARGET_COLUMN = "label"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the Agri-Invest crop recommendation model."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Path to the Kaggle crop recommendation CSV.",
    )
    parser.add_argument(
        "--n-estimators",
        type=int,
        default=300,
        help="Number of trees in the Random Forest.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of rows reserved for test evaluation.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducible training.",
    )
    return parser.parse_args()


def validate_columns(dataframe: pd.DataFrame) -> None:
    missing = [column for column in FEATURE_COLUMNS + [TARGET_COLUMN] if column not in dataframe.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")


def save_confusion_matrix(labels: list[str], matrix, output_path: Path) -> None:
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="YlGnBu",
        xticklabels=labels,
        yticklabels=labels,
    )
    plt.title("Crop Recommendation Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def main() -> None:
    args = parse_args()
    dataset_path = args.dataset.resolve()

    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {dataset_path}. Place Crop_recommendation.csv under "
            "datasets/crop-recommendation/ before training."
        )

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    dataframe = pd.read_csv(dataset_path)
    validate_columns(dataframe)

    features = dataframe[FEATURE_COLUMNS]
    labels = dataframe[TARGET_COLUMN].astype(str)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=labels,
    )

    print("Training crop recommendation model")
    print(f"Dataset rows: {len(dataframe)}")
    print(f"Training rows: {len(x_train)} | Test rows: {len(x_test)}")
    print(f"Unique crops: {labels.nunique()}")

    model = RandomForestClassifier(
        n_estimators=args.n_estimators,
        random_state=args.random_state,
        n_jobs=-1,
        class_weight="balanced_subsample",
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    probability_matrix = model.predict_proba(x_test)
    class_labels = list(model.classes_)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, average="weighted", zero_division=0)
    recall = recall_score(y_test, predictions, average="weighted", zero_division=0)
    matrix = confusion_matrix(y_test, predictions, labels=class_labels)

    print("\nEvaluation")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print("\nClassification Report")
    print(classification_report(y_test, predictions, zero_division=0))

    model_path = ARTIFACT_DIR / "crop_model.pkl"
    metrics_path = ARTIFACT_DIR / "crop_metrics.json"
    confusion_path = ARTIFACT_DIR / "crop_confusion_matrix.png"

    joblib.dump(
        {
            "model": model,
            "feature_names": FEATURE_COLUMNS,
            "classes": class_labels,
        },
        model_path,
    )

    top_confidence = probability_matrix.max(axis=1)
    metrics_payload = {
        "accuracy": round(float(accuracy), 6),
        "precision_weighted": round(float(precision), 6),
        "recall_weighted": round(float(recall), 6),
        "average_prediction_confidence": round(float(top_confidence.mean()), 6),
        "dataset": str(dataset_path),
        "test_size": args.test_size,
        "samples": len(dataframe),
        "classes": class_labels,
    }
    metrics_path.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")
    save_confusion_matrix(class_labels, matrix, confusion_path)

    print("\nArtifacts")
    print(f"Model          : {model_path}")
    print(f"Metrics        : {metrics_path}")
    print(f"Confusion chart: {confusion_path}")


if __name__ == "__main__":
    main()
