from __future__ import annotations

from datetime import datetime

import pandas as pd


FEATURES = [
    "age_years",
    "dig_count_5yr",
    "surface_condition_score",
    "avg_rainfall_mm_annual",
    "traffic_load_score",
    "pipe_age_water",
    "pipe_age_gas",
    "cable_age_telecom",
    "days_since_last_dig",
]


def add_days_since_last_dig(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["days_since_last_dig"] = (datetime.now() - pd.to_datetime(df["last_dig_date"])).dt.days
    return df

