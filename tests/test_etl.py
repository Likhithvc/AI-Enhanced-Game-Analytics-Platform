import pytest
import pandas as pd
from scripts.etl_aggregate import compute_aggregate

def test_etl_aggregate_small_dataset():
    df = pd.DataFrame([
        {"session_id": "s1", "event_type": "move", "x": 1, "y": 2},
        {"session_id": "s1", "event_type": "move", "x": 2, "y": 3},
        {"session_id": "s2", "event_type": "jump", "x": 5, "y": 6}
    ])
    result = compute_aggregate(df)
    # Example: check aggregate by session_id
    assert result.loc[result["session_id"] == "s1", "x"].sum() == 3
    assert result.loc[result["session_id"] == "s2", "x"].sum() == 5
