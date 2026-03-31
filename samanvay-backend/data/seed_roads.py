import random

import numpy as np
import pandas as pd
from faker import Faker

fake = Faker("en_IN")
random.seed(42)
np.random.seed(42)

NAVI_MUMBAI_ROADS = [
    "Sector 15 Road A",
    "Sector 17 Main Road",
    "Palm Beach Road",
    "Turbhe Station Road",
    "Vashi Sector 30 Road",
    "Nerul Link Road",
    "Sanpada Station Road",
    "Juinagar Main Road",
    "Kharghar Sector 12",
    "Panvel NH-4 Service Road",
    "Belapur CBD Road",
    "Airoli Link Road",
]

WARDS = ["Ward A", "Ward B", "Ward C", "Ward D", "Ward E", "Ward F"]


def main():
    rows: list[dict] = []
    for _ in range(500):
        age = random.uniform(2, 25)
        dig_count = random.randint(0, 12)
        rainfall = random.uniform(1800, 2400)
        traffic = random.uniform(1, 10)
        pipe_water = random.randint(5, 40)
        pipe_gas = random.randint(3, 30)
        cable_telecom = random.randint(2, 20)
        surface = random.uniform(1, 10)

        risk = (
            (dig_count / 12) * 0.35
            + (age / 25) * 0.20
            + (pipe_water / 40) * 0.15
            + ((10 - surface) / 10) * 0.15
            + (rainfall / 2400) * 0.10
            + (traffic / 10) * 0.05
        )
        was_dug = 1 if (risk + random.uniform(-0.1, 0.1)) > 0.45 else 0

        rows.append(
            {
                "road_name": random.choice(NAVI_MUMBAI_ROADS),
                "ward": random.choice(WARDS),
                "age_years": round(age, 1),
                "last_dig_date": fake.date_between(start_date="-3y", end_date="today").isoformat(),
                "dig_count_5yr": dig_count,
                "surface_condition_score": round(surface, 1),
                "avg_rainfall_mm_annual": round(rainfall, 0),
                "traffic_load_score": round(traffic, 1),
                "pipe_age_water": pipe_water,
                "pipe_age_gas": pipe_gas,
                "cable_age_telecom": cable_telecom,
                "was_dug_within_90d": was_dug,
            }
        )

    pd.DataFrame(rows).to_csv("data/mock/road_health.csv", index=False)
    print("Generated 500 road health training rows")


if __name__ == "__main__":
    main()

