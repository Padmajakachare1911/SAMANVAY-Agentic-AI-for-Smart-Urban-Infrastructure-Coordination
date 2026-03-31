"""
Train a Random Forest classifier to predict whether a road will need
to be dug within the next 90 days.

Expected accuracy: >75% on validation set
Save model to ml/model.pkl
Also save feature importance to ml/feature_importance.json
"""

from __future__ import annotations

import json
import pickle

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from ml.features import FEATURES, add_days_since_last_dig


def train() -> float:
    df = pd.read_csv("data/mock/road_health.csv")
    df = add_days_since_last_dig(df)

    X = df[FEATURES]
    y = df["was_dug_within_90d"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=5,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_val)
    acc = accuracy_score(y_val, preds)
    print(f"Validation accuracy: {acc:.3f}")
    print(classification_report(y_val, preds))

    with open("ml/model.pkl", "wb") as f:
        pickle.dump(model, f)

    importance = dict(zip(FEATURES, model.feature_importances_.tolist()))
    with open("ml/feature_importance.json", "w", encoding="utf-8") as f:
        json.dump(importance, f, indent=2)

    print("Model saved to ml/model.pkl")
    return float(acc)


if __name__ == "__main__":
    train()

