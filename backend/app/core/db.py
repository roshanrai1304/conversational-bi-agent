import logging
import os
from pathlib import Path

import duckdb
from dotenv import load_dotenv

from app.core.exceptions import DataLoadError

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/

# Method 1: Load as TABLE (not VIEW) — DuckDB stores data in columnar format in RAM.
# Queries are faster because there is no CSV parsing on each query execution.
# DuckDB also builds internal statistics that improve query planning.
# Startup is ~10-30s slower (one-time cost) but all subsequent queries benefit.
CSV_TABLES = {
    "orders": "orders.csv",
    "order_products_prior": "order_products__prior.csv",
    "order_products_train": "order_products__train.csv",
    "products": "products.csv",
    "aisles": "aisles.csv",
    "departments": "departments.csv",
}


def _resolve_data_dir() -> Path:
    raw = os.getenv("DATA_DIR", "../data")
    path = Path(raw)
    if not path.is_absolute():
        path = (BASE_DIR / path).resolve()
    return path


def load_database() -> duckdb.DuckDBPyConnection:
    data_dir = _resolve_data_dir()
    logger.info("Loading database from: %s", data_dir)

    con = duckdb.connect()

    for table_name, filename in CSV_TABLES.items():
        filepath = data_dir / filename
        if not filepath.exists():
            raise DataLoadError(f"CSV not found: {filepath}")
        con.execute(
            f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{filepath}', nullstr='')"
        )
        logger.info("Table loaded: %s", table_name)

    # Materialize the union as a TABLE — avoids recomputing the UNION on every query
    con.execute("""
        CREATE TABLE all_order_products AS
        SELECT * FROM order_products_prior
        UNION ALL
        SELECT * FROM order_products_train
    """)
    logger.info("Table loaded: all_order_products (prior + train combined)")

    # Index on order_id speeds up JOIN operations (especially self-joins and co-occurrence)
    con.execute("CREATE INDEX idx_aop_order_id ON all_order_products (order_id)")
    con.execute("CREATE INDEX idx_aop_product_id ON all_order_products (product_id)")
    con.execute("CREATE INDEX idx_orders_user_id ON orders (user_id)")
    logger.info("Indexes created on all_order_products and orders")

    return con


def get_schema_string(con: duckdb.DuckDBPyConnection) -> str:
    schema_parts = []

    view_meta = {
        "orders": (
            "~3.4M rows. order_dow: 0=Sunday..6=Saturday. "
            "days_since_prior_order is NULL for a user's first order."
        ),
        "order_products_prior": "~32M rows. reordered: 1=reordered, 0=first time.",
        "order_products_train": "~1.4M rows. Same schema as order_products_prior.",
        "all_order_products": "UNION of prior + train (~33.8M rows). Use this for most product queries.",
        "products": "~50K rows. Links to aisles and departments.",
        "aisles": "134 rows. Lookup table.",
        "departments": "21 rows. Lookup table.",
    }

    all_views = list(CSV_TABLES.keys()) + ["all_order_products"]

    for view_name in all_views:
        try:
            cols = con.execute(f"DESCRIBE {view_name}").fetchall()
            col_str = ", ".join(f"{c[0]} ({c[1]})" for c in cols)
            note = view_meta.get(view_name, "")
            schema_parts.append(
                f"Table: {view_name}\n  Columns: {col_str}\n  Note: {note}"
            )
        except Exception as e:
            logger.warning("Could not describe view %s: %s", view_name, str(e))

    return "\n\n".join(schema_parts)
