import pytest
from unittest.mock import patch

from app.core.sql_generator import generate_sql
from app.core.exceptions import InvalidSQLOutputError


MOCK_SCHEMA = "Table: orders\n  Columns: order_id (INTEGER), user_id (INTEGER)"


def test_generates_valid_sql():
    with patch("app.core.sql_generator.call_llm", return_value="SELECT COUNT(*) FROM orders"):
        sql = generate_sql("how many orders?", MOCK_SCHEMA)
    assert sql == "SELECT COUNT(*) FROM orders"


def test_strips_markdown_fences():
    raw = "```sql\nSELECT COUNT(*) FROM orders\n```"
    with patch("app.core.sql_generator.call_llm", return_value=raw):
        sql = generate_sql("how many orders?", MOCK_SCHEMA)
    assert "```" not in sql
    assert sql.startswith("SELECT")


def test_strips_trailing_semicolon():
    with patch("app.core.sql_generator.call_llm", return_value="SELECT COUNT(*) FROM orders;"):
        sql = generate_sql("how many orders?", MOCK_SCHEMA)
    assert not sql.endswith(";")


def test_raises_on_non_sql_output():
    with patch("app.core.sql_generator.call_llm", return_value="I cannot answer that question."):
        with pytest.raises(InvalidSQLOutputError):
            generate_sql("tell me a joke", MOCK_SCHEMA)


def test_schema_injected_into_prompt():
    """The schema string must appear in the prompt sent to the LLM."""
    with patch("app.core.sql_generator.call_llm", return_value="SELECT 1") as mock_llm:
        generate_sql("test question", MOCK_SCHEMA)
    system_arg = mock_llm.call_args.kwargs.get("system") or mock_llm.call_args[1].get("system", "")
    assert MOCK_SCHEMA in system_arg


def test_error_context_injected_on_retry():
    """Error context must appear in the prompt on retry calls."""
    with patch("app.core.sql_generator.call_llm", return_value="SELECT 1") as mock_llm:
        generate_sql("test", MOCK_SCHEMA, error_context="bad column: foo")
    system_arg = mock_llm.call_args.kwargs.get("system") or mock_llm.call_args[1].get("system", "")
    assert "bad column: foo" in system_arg
