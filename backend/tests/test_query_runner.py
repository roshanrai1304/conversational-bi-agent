import pandas as pd
from app.core.query_runner import run_query, run_query_with_retry


def test_valid_sql_returns_dataframe(mock_db):
    result = run_query("SELECT COUNT(*) AS total FROM orders", mock_db)
    assert result["success"] is True
    assert isinstance(result["data"], pd.DataFrame)
    assert result["error"] is None
    assert result["data"].iloc[0, 0] == 4


def test_invalid_sql_returns_error_dict(mock_db):
    result = run_query("SELECT * FROM nonexistent_table_xyz", mock_db)
    assert result["success"] is False
    assert result["data"] is None
    assert result["error"] is not None


def test_invalid_sql_never_raises(mock_db):
    """run_query must never raise — always return a dict."""
    try:
        result = run_query("THIS IS NOT SQL AT ALL", mock_db)
        assert result["success"] is False
    except Exception as e:
        pytest.fail(f"run_query raised an exception: {e}")


def test_retry_corrects_bad_sql(mock_db):
    """On first failure, retry should produce a corrected result."""
    from unittest.mock import patch

    good_sql = "SELECT COUNT(*) AS total FROM orders"

    with patch("app.core.sql_generator.generate_sql", return_value=good_sql):
        result = run_query_with_retry(
            question="how many orders?",
            sql="SELECT * FROM bad_table",
            con=mock_db,
            schema="fake schema",
        )

    assert result["success"] is True
    assert result["data"].iloc[0, 0] == 4


def test_three_table_join(mock_db):
    """Verify 3-table join works on mock data."""
    sql = """
        SELECT d.department, COUNT(*) AS order_count
        FROM all_order_products op
        JOIN products p ON op.product_id = p.product_id
        JOIN departments d ON p.department_id = d.department_id
        GROUP BY d.department
        ORDER BY order_count DESC
    """
    result = run_query(sql, mock_db)
    assert result["success"] is True
    assert len(result["data"]) > 0
