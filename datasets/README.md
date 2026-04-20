# Dataset Setup

This project uses two real datasets that must be downloaded before model training.

## 1. Crop Recommendation Dataset

Recommended Kaggle source:

- https://www.kaggle.com/datasets/ishank2005/crop-reproduction-ecosystem-recommendation

Expected local path:

```text
datasets/
  crop-recommendation/
    Crop_recommendation.csv
```

The CSV must contain these columns:

- `N`
- `P`
- `K`
- `temperature`
- `humidity`
- `ph`
- `rainfall`
- `label`

## 2. PlantVillage Dataset

Recommended Kaggle source:

- https://www.kaggle.com/datasets/moazeldsokyx/plantvillage

Expected local path:

```text
datasets/
  plantvillage/
    train/
    validation/
    test/
```

The training pipeline also supports a flat class-folder layout and will split the data automatically if explicit train/validation/test folders are not present.

## Supported Disease Classes

The disease model filters PlantVillage images down to Tomato, Potato, and Corn classes, including healthy leaves.

## Suggested Kaggle CLI Commands

```powershell
kaggle datasets download -d ishank2005/crop-reproduction-ecosystem-recommendation -p datasets/crop-recommendation --unzip
kaggle datasets download -d moazeldsokyx/plantvillage -p datasets/plantvillage --unzip
```

## Training Outputs

After dataset download, the training scripts will create:

- `ai-models/artifacts/crop_model.pkl`
- `ai-models/artifacts/crop_metrics.json`
- `ai-models/artifacts/disease_model.h5`
- `ai-models/artifacts/disease_labels.json`
- `ai-models/artifacts/disease_metrics.json`
