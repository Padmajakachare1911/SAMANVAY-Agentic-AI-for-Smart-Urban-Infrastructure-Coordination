from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ml.features import FEATURES, add_days_since_last_dig


MODEL_PATH = Path("ml/model.pkl")


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("ml/model.pkl not found. Run `python -m ml.train` first.")
    with MODEL_PATH.open("rb") as f:
        return pickle.load(f)


def predict_proba_rows(rows: list[dict[str, Any]]) -> list[float]:
    model = load_model()
    df = pd.DataFrame(rows)
    df = add_days_since_last_dig(df)
    X = df[FEATURES]
    proba = model.predict_proba(X)[:, 1]
    return [float(x) for x in np.round(proba, 4)]

