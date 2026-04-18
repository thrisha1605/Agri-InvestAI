# AI Model Training

## Files

- `train_crop_model.py`: Random Forest crop recommendation training
- `train_disease_model.py`: MobileNetV2 transfer-learning disease training
- `requirements.txt`: Python dependencies

## Crop Model

```powershell
python ai-models\train_crop_model.py --data datasets\crop-recommendation\Crop_recommendation.csv
```

Outputs:

- `ai-models/artifacts/crop_model.pkl`
- `ai-models/artifacts/crop_metrics.json`
- `ai-models/artifacts/crop_confusion_matrix.png`

Metrics written by the script:

- accuracy
- weighted precision
- weighted recall
- confusion matrix

## Disease Model

```powershell
python ai-models\train_disease_model.py --data datasets\plantvillage
```

Outputs:

- `ai-models/artifacts/disease_model.h5`
- `ai-models/artifacts/disease_labels.json`
- `ai-models/artifacts/disease_metrics.json`
- `ai-models/artifacts/disease_training_curves.png`
- `ai-models/artifacts/disease_confusion_matrix.png`

Metrics written by the script:

- accuracy
- weighted precision
- weighted recall
- confusion matrix
- class report
