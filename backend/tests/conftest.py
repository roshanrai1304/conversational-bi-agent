import pandas as pd
import pytest
import duckdb


@pytest.fixture
def mock_db():
    """In-memory DuckDB with minimal sample data matching the real schema."""
    con = duckdb.connect()

    con.execute("""
        CREATE TABLE orders (
            order_id INTEGER, user_id INTEGER, eval_set VARCHAR,
            order_number INTEGER, order_dow INTEGER,
            order_hour_of_day INTEGER, days_since_prior_order DOUBLE
        )
    """)
    con.execute("""
        INSERT INTO orders VALUES
        (1, 1, 'prior', 1, 0, 10, NULL),
        (2, 1, 'prior', 2, 3, 14, 7.0),
        (3, 2, 'prior', 1, 5, 9, NULL),
        (4, 2, 'train', 2, 1, 11, 14.0)
    """)

    con.execute("""
        CREATE TABLE departments (department_id INTEGER, department VARCHAR)
    """)
    con.execute("""
        INSERT INTO departments VALUES (1, 'frozen'), (2, 'produce'), (3, 'dairy eggs')
    """)

    con.execute("""
        CREATE TABLE aisles (aisle_id INTEGER, aisle VARCHAR)
    """)
    con.execute("""
        INSERT INTO aisles VALUES (1, 'yogurt'), (2, 'fresh vegetables'), (3, 'frozen meals')
    """)

    con.execute("""
        CREATE TABLE products (
            product_id INTEGER, product_name VARCHAR,
            aisle_id INTEGER, department_id INTEGER
        )
    """)
    con.execute("""
        INSERT INTO products VALUES
        (1, 'Yogurt', 1, 3),
        (2, 'Spinach', 2, 2),
        (3, 'Frozen Pizza', 3, 1)
    """)

    con.execute("""
        CREATE TABLE all_order_products (
            order_id INTEGER, product_id INTEGER,
            add_to_cart_order INTEGER, reordered INTEGER
        )
    """)
    con.execute("""
        INSERT INTO all_order_products VALUES
        (1, 1, 1, 0), (1, 2, 2, 0),
        (2, 1, 1, 1), (2, 3, 2, 0),
        (3, 2, 1, 0),
        (4, 1, 1, 1)
    """)

    return con


@pytest.fixture
def two_col_df():
    """2-column DataFrame: string + numeric, >8 rows → bar chart."""
    departments = ["produce", "dairy", "frozen", "snacks", "beverages", "meat seafood", "pantry", "deli", "bakery"]
    return pd.DataFrame({"department": departments, "order_count": [100, 80, 60, 55, 50, 45, 40, 35, 30]})


@pytest.fixture
def time_series_df():
    """Time-series DataFrame with hour column (line chart input)."""
    return pd.DataFrame({"order_hour_of_day": list(range(24)), "order_count": [i * 10 for i in range(24)]})


@pytest.fixture
def single_value_df():
    """Single cell DataFrame (metric display input)."""
    return pd.DataFrame({"total_orders": [3421083]})


@pytest.fixture
def multi_col_df():
    """3+ column DataFrame (table display input)."""
    return pd.DataFrame({
        "department": ["produce", "dairy"],
        "order_count": [100, 80],
        "reorder_rate": [0.72, 0.65],
    })
