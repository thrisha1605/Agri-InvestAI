from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score
from sklearn.model_selection import train_test_split


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = PROJECT_ROOT / "datasets" / "plantvillage"
ARTIFACT_DIR = PROJECT_ROOT / "ai-models" / "artifacts"
IMAGE_SIZE = (224, 224)
AUTOTUNE = tf.data.AUTOTUNE
SUPPORTED_PREFIXES = ("Tomato", "Potato", "Corn_(maize)", "Corn")


@dataclass(frozen=True)
class Sample:
    file_path: Path
    label: str
    split: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train the Agri-Invest disease detection model with MobileNetV2."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Path to the PlantVillage dataset directory.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=6,
        help="Warm-up epochs with the backbone frozen.",
    )
    parser.add_argument(
        "--fine-tune-epochs",
        type=int,
        default=0,
        help="Additional fine-tuning epochs after unfreezing the top MobileNet layers.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Training batch size.",
    )
    parser.add_argument(
        "--validation-size",
        type=float,
        default=0.1,
        help="Validation fraction when the dataset has no explicit validation split.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.1,
        help="Test fraction when the dataset has no explicit test split.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducible splitting.",
    )
    return parser.parse_args()


def normalize_label(raw_label: str) -> str | None:
    cleaned = raw_label.strip()
    if not cleaned.startswith(SUPPORTED_PREFIXES):
        return None
    return cleaned


def collect_split_samples(split_dir: Path, split_name: str) -> list[Sample]:
    samples: list[Sample] = []
    for class_dir in sorted(path for path in split_dir.iterdir() if path.is_dir()):
        label = normalize_label(class_dir.name)
        if label is None:
            continue
        for image_path in class_dir.rglob("*"):
            if image_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                samples.append(Sample(file_path=image_path, label=label, split=split_name))
    return samples


def collect_samples(dataset_dir: Path, validation_size: float, test_size: float, random_state: int) -> list[Sample]:
    split_aliases = {
        "train": {"train"},
        "validation": {"validation", "valid", "val"},
        "test": {"test"},
    }

    discovered: dict[str, Path] = {}
    for split_name, aliases in split_aliases.items():
        for alias in aliases:
            candidate = dataset_dir / alias
            if candidate.exists() and candidate.is_dir():
                discovered[split_name] = candidate
                break

    if "train" in discovered and "validation" in discovered and "test" in discovered:
        return (
            collect_split_samples(discovered["train"], "train")
            + collect_split_samples(discovered["validation"], "validation")
            + collect_split_samples(discovered["test"], "test")
        )

    file_paths: list[Path] = []
    labels: list[str] = []
    for class_dir in sorted(path for path in dataset_dir.iterdir() if path.is_dir()):
        label = normalize_label(class_dir.name)
        if label is None:
            continue
        for image_path in class_dir.rglob("*"):
            if image_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                file_paths.append(image_path)
                labels.append(label)

    if not file_paths:
        raise FileNotFoundError(
            "No Tomato, Potato, or Corn classes were found in the PlantVillage dataset."
        )

    train_paths, test_paths, train_labels, test_labels = train_test_split(
        file_paths,
        labels,
        test_size=test_size,
        random_state=random_state,
        stratify=labels,
    )
    adjusted_validation_size = validation_size / (1.0 - test_size)
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        train_paths,
        train_labels,
        test_size=adjusted_validation_size,
        random_state=random_state,
        stratify=train_labels,
    )

    samples: list[Sample] = []
    for split_name, split_paths, split_labels in (
        ("train", train_paths, train_labels),
        ("validation", val_paths, val_labels),
        ("test", test_paths, test_labels),
    ):
        for file_path, label in zip(split_paths, split_labels, strict=True):
            samples.append(Sample(file_path=file_path, label=label, split=split_name))
    return samples


def preprocess_image(file_path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    image = tf.io.read_file(file_path)
    image = tf.image.decode_image(image, channels=3, expand_animations=False)
    image = tf.image.resize(image, IMAGE_SIZE)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    return image, label


def build_dataset(file_paths: list[str], labels: list[int], batch_size: int, training: bool) -> tf.data.Dataset:
    dataset = tf.data.Dataset.from_tensor_slices((file_paths, labels))
    if training:
        dataset = dataset.shuffle(buffer_size=len(file_paths), reshuffle_each_iteration=True)
    dataset = dataset.map(preprocess_image, num_parallel_calls=AUTOTUNE)
    if training:
        augmenter = tf.keras.Sequential(
            [
                tf.keras.layers.RandomFlip("horizontal"),
                tf.keras.layers.RandomRotation(0.05),
                tf.keras.layers.RandomZoom(0.1),
            ]
        )
        dataset = dataset.map(
            lambda image, label: (augmenter(image, training=True), label),
            num_parallel_calls=AUTOTUNE,
        )
    return dataset.batch(batch_size).prefetch(AUTOTUNE)


def build_model(num_classes: int) -> tuple[tf.keras.Model, tf.keras.Model]:
    backbone = tf.keras.applications.MobileNetV2(
        include_top=False,
        weights="imagenet",
        input_shape=IMAGE_SIZE + (3,),
    )
    backbone.trainable = False

    inputs = tf.keras.Input(shape=IMAGE_SIZE + (3,))
    features = backbone(inputs, training=False)
    pooled = tf.keras.layers.GlobalAveragePooling2D()(features)
    dropped = tf.keras.layers.Dropout(0.3)(pooled)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(dropped)

    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, backbone


def save_training_curves(history_segments: list[tf.keras.callbacks.History], output_path: Path) -> None:
    accuracy_values: list[float] = []
    validation_values: list[float] = []
    loss_values: list[float] = []
    validation_loss_values: list[float] = []

    for history in history_segments:
        accuracy_values.extend(history.history.get("accuracy", []))
        validation_values.extend(history.history.get("val_accuracy", []))
        loss_values.extend(history.history.get("loss", []))
        validation_loss_values.extend(history.history.get("val_loss", []))

    epochs = range(1, len(accuracy_values) + 1)
    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.plot(epochs, accuracy_values, label="Train Accuracy")
    plt.plot(epochs, validation_values, label="Validation Accuracy")
    plt.title("Disease Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(epochs, loss_values, label="Train Loss")
    plt.plot(epochs, validation_loss_values, label="Validation Loss")
    plt.title("Disease Model Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()

    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def save_confusion_chart(labels: list[str], matrix: np.ndarray, output_path: Path) -> None:
    plt.figure(figsize=(12, 10))
    sns.heatmap(matrix, annot=True, fmt="d", cmap="YlOrBr", xticklabels=labels, yticklabels=labels)
    plt.title("Disease Detection Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def main() -> None:
    args = parse_args()
    dataset_dir = args.dataset.resolve()
    if not dataset_dir.exists():
        raise FileNotFoundError(
            f"Dataset directory not found at {dataset_dir}. Place the PlantVillage dataset under datasets/plantvillage/."
        )

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    tf.keras.utils.set_random_seed(args.random_state)
    samples = collect_samples(dataset_dir, args.validation_size, args.test_size, args.random_state)

    labels = sorted({sample.label for sample in samples})
    label_to_index = {label: index for index, label in enumerate(labels)}

    split_map = {
        "train": [sample for sample in samples if sample.split == "train"],
        "validation": [sample for sample in samples if sample.split == "validation"],
        "test": [sample for sample in samples if sample.split == "test"],
    }

    print("Training disease detection model")
    print(f"Dataset root      : {dataset_dir}")
    print(f"Supported classes : {len(labels)}")
    print(
        f"Train/Val/Test    : {len(split_map['train'])}/{len(split_map['validation'])}/{len(split_map['test'])}"
    )

    train_ds = build_dataset(
        [str(sample.file_path) for sample in split_map["train"]],
        [label_to_index[sample.label] for sample in split_map["train"]],
        args.batch_size,
        training=True,
    )
    validation_ds = build_dataset(
        [str(sample.file_path) for sample in split_map["validation"]],
        [label_to_index[sample.label] for sample in split_map["validation"]],
        args.batch_size,
        training=False,
    )
    test_ds = build_dataset(
        [str(sample.file_path) for sample in split_map["test"]],
        [label_to_index[sample.label] for sample in split_map["test"]],
        args.batch_size,
        training=False,
    )

    model, backbone = build_model(len(labels))
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=3,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=2,
            min_lr=1e-6,
        ),
    ]

    warmup_history = model.fit(
        train_ds,
        validation_data=validation_ds,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1,
    )

    history_segments = [warmup_history]

    if args.fine_tune_epochs > 0:
        backbone.trainable = True
        for layer in backbone.layers[:-30]:
            layer.trainable = False
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        fine_tune_history = model.fit(
            train_ds,
            validation_data=validation_ds,
            epochs=args.epochs + args.fine_tune_epochs,
            initial_epoch=warmup_history.epoch[-1] + 1,
            callbacks=callbacks,
            verbose=1,
        )
        history_segments.append(fine_tune_history)

    probabilities = model.predict(test_ds, verbose=0)
    predicted_indices = np.argmax(probabilities, axis=1)
    true_indices = np.concatenate([batch_labels.numpy() for _, batch_labels in test_ds], axis=0)

    accuracy = accuracy_score(true_indices, predicted_indices)
    precision = precision_score(true_indices, predicted_indices, average="weighted", zero_division=0)
    recall = recall_score(true_indices, predicted_indices, average="weighted", zero_division=0)
    matrix = confusion_matrix(true_indices, predicted_indices, labels=list(range(len(labels))))

    print("\nEvaluation")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print("\nClassification Report")
    print(classification_report(true_indices, predicted_indices, target_names=labels, zero_division=0))

    model_path = ARTIFACT_DIR / "disease_model.h5"
    labels_path = ARTIFACT_DIR / "disease_labels.json"
    metrics_path = ARTIFACT_DIR / "disease_metrics.json"
    curves_path = ARTIFACT_DIR / "disease_training_curves.png"
    confusion_path = ARTIFACT_DIR / "disease_confusion_matrix.png"

    model.save(model_path)
    labels_path.write_text(json.dumps(labels, indent=2), encoding="utf-8")
    metrics_path.write_text(
        json.dumps(
            {
                "accuracy": round(float(accuracy), 6),
                "precision_weighted": round(float(precision), 6),
                "recall_weighted": round(float(recall), 6),
                "dataset": str(dataset_dir),
                "classes": labels,
                "train_samples": len(split_map["train"]),
                "validation_samples": len(split_map["validation"]),
                "test_samples": len(split_map["test"]),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    save_training_curves(history_segments, curves_path)
    save_confusion_chart(labels, matrix, confusion_path)

    print("\nArtifacts")
    print(f"Model          : {model_path}")
    print(f"Labels         : {labels_path}")
    print(f"Metrics        : {metrics_path}")
    print(f"Training curves: {curves_path}")
    print(f"Confusion chart: {confusion_path}")


if __name__ == "__main__":
    main()
