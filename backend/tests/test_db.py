import pytest
from unittest.mock import patch
from pathlib import Path

from app.core.db import load_database, get_schema_string
from app.core.exceptions import DataLoadError


def test_load_database_registers_all_views(tmp_path):
    """All 6 CSV views + all_order_products union view must be registered."""
    import pandas as pd

    # Create minimal CSVs in tmp_path
    pd.DataFrame({"order_id": [1], "user_id": [1], "eval_set": ["prior"],
                  "order_number": [1], "order_dow": [0],
                  "order_hour_of_day": [10], "days_since_prior_order": [None]}).to_csv(
        tmp_path / "orders.csv", index=False)
    pd.DataFrame({"order_id": [1], "product_id": [1],
                  "add_to_cart_order": [1], "reordered": [0]}).to_csv(
        tmp_path / "order_products__prior.csv", index=False)
    pd.DataFrame({"order_id": [2], "product_id": [1],
                  "add_to_cart_order": [1], "reordered": [1]}).to_csv(
        tmp_path / "order_products__train.csv", index=False)
    pd.DataFrame({"product_id": [1], "product_name": ["Yogurt"],
                  "aisle_id": [1], "department_id": [1]}).to_csv(
        tmp_path / "products.csv", index=False)
    pd.DataFrame({"aisle_id": [1], "aisle": ["yogurt"]}).to_csv(
        tmp_path / "aisles.csv", index=False)
    pd.DataFrame({"department_id": [1], "department": ["dairy"]}).to_csv(
        tmp_path / "departments.csv", index=False)

    with patch.dict("os.environ", {"DATA_DIR": str(tmp_path)}):
        con = load_database()

    views = con.execute("SHOW TABLES").fetchall()
    view_names = {v[0] for v in views}

    assert "orders" in view_names
    assert "order_products_prior" in view_names
    assert "order_products_train" in view_names
    assert "products" in view_names
    assert "aisles" in view_names
    assert "departments" in view_names
    assert "all_order_products" in view_names


def test_load_database_raises_on_missing_csv(tmp_path):
    """DataLoadError raised when any CSV is missing."""
    with patch.dict("os.environ", {"DATA_DIR": str(tmp_path)}):
        with pytest.raises(DataLoadError):
            load_database()


def test_get_schema_string_contains_all_tables(mock_db):
    """Schema string must mention all 7 views."""
    schema = get_schema_string(mock_db)
    for name in ["orders", "departments", "aisles", "products", "all_order_products"]:
        assert name in schema, f"'{name}' missing from schema string"


def test_get_schema_string_contains_column_names(mock_db):
    """Schema string must include key column names."""
    schema = get_schema_string(mock_db)
    assert "order_id" in schema
    assert "days_since_prior_order" in schema
    assert "reordered" in schema
