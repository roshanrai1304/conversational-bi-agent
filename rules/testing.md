# Testing Rules

## Framework
- Use **pytest** for all tests — installed via `uv pip sync requirements.txt`
- Activate the venv first (`source .venv/bin/activate`), then run bare `pytest` — no `uv run` needed with this workflow
- Test files go in `tests/` directory, mirroring the `core/` structure
- Test file naming: `test_<module_name>.py` — e.g., `test_sql_generator.py`
- Test function naming: `test_<what_it_does>` — e.g., `test_generates_valid_sql_for_single_table_query`

## Directory Structure

```
tests/
├── conftest.py              # Shared fixtures (DuckDB connection, mock LLM, sample data)
├── test_db.py               # DuckDB view registration, schema extraction
├── test_sql_generator.py    # Prompt construction, SQL parsing
├── test_query_runner.py     # SQL execution, error handling, retry logic
├── test_chart_selector.py   # Chart type selection from DataFrame shape
└── test_llm.py              # LLM client, fallback logic (mock API calls)
```

## What to Test

### Must Test
- `db.py` — all 6 views register without error, schema string is correct
- `sql_generator.py` — prompt contains schema, few-shot examples are included, output SQL is stripped cleanly
- `query_runner.py` — valid SQL returns a DataFrame, invalid SQL returns `{"success": False, "error": ...}`, retry is triggered on first failure
- `chart_selector.py` — 2-column (str + int) result → bar, time-dimension result → line, single value → metric

### Do Not Over-Test
- Do not test Streamlit rendering — it is UI glue, not logic
- Do not test that Groq API returns SQL — mock the API response instead
- Do not test pandas operations on DataFrames returned by DuckDB — trust the library

## Fixtures (conftest.py)

```python
import pytest
import duckdb
import pandas as pd

@pytest.fixture
def mock_db():
    """In-memory DuckDB with tiny sample data for all 6 tables."""
    con = duckdb.connect()
    con.execute("CREATE TABLE orders (order_id INT, user_id INT, eval_set VARCHAR, order_number INT, order_dow INT, order_hour_of_day INT, days_since_prior_order DOUBLE)")
    con.execute("INSERT INTO orders VALUES (1, 1, 'prior', 1, 0, 10, NULL), (2, 1, 'prior', 2, 3, 14, 7.0)")
    # Add other tables as needed
    return con

@pytest.fixture
def sample_dataframe():
    """Simple 2-column DataFrame for chart selector tests."""
    return pd.DataFrame({"department": ["produce", "dairy"], "count": [100, 80]})

@pytest.fixture
def mock_llm_response():
    """Canned SQL response to avoid real API calls in tests."""
    return "SELECT department, COUNT(*) as order_count FROM departments GROUP BY department ORDER BY order_count DESC LIMIT 5"
```

## Mocking LLM Calls

Never call real Groq or Ollama APIs in tests. Use `unittest.mock.patch`:

```python
from unittest.mock import patch

def test_sql_generator_includes_schema(mock_db):
    with patch("core.llm.call_groq") as mock_call:
        mock_call.return_value = "SELECT COUNT(*) FROM orders"
        result = generate_sql("how many orders are there?", mock_db)
        assert "orders" in mock_call.call_args[0][0]  # schema was in prompt
        assert result == "SELECT COUNT(*) FROM orders"
```

## Running Tests

```bash
# Activate the venv (once per terminal session)
source .venv/bin/activate

# All tests
pytest tests/

# Single file
pytest tests/test_query_runner.py -v

# Show print output
pytest tests/ -s

# Stop on first failure
pytest tests/ -x
```

## Assertions Style
- Use plain `assert` — not `assertEqual`, `assertTrue` (pytest style, not unittest)
- One logical assertion per test where possible
- Include a message on non-obvious assertions: `assert result["success"] is True, f"Query failed: {result['error']}"`

## Testing FastAPI Endpoints

Use FastAPI's `TestClient` (backed by `httpx`) — no real server needed.
Add `httpx` as a dev dependency: `uv add --dev httpx`

```python
# tests/test_routes.py
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

def test_query_endpoint_returns_200():
    with patch("app.routes.query.generate_sql") as mock_sql, \
         patch("app.routes.query.run_query_with_retry") as mock_run:
        mock_sql.return_value = "SELECT COUNT(*) FROM orders"
        mock_run.return_value = {"success": True, "data": some_df, "error": None}
        response = client.post("/api/query", json={"question": "how many orders?"})
        assert response.status_code == 200
        assert response.json()["success"] is True

def test_query_endpoint_rejects_empty_question():
    response = client.post("/api/query", json={"question": ""})
    assert response.status_code == 422  # Pydantic validation error
```

Rules:
- Always mock `generate_sql` and `run_query_with_retry` in route tests — no real LLM or DB calls
- Test both success and failure response shapes
- Test that empty/invalid request bodies return 422

## What a Passing Test Suite Means
- All 6 CSVs load and register as DuckDB views without error
- A simple NL query produces a non-empty DataFrame
- An invalid SQL query returns a structured error dict (no exception raised to caller)
- Chart selector returns one of: "bar", "line", "pie", "table", "metric" — never None
- POST /api/query returns 200 with correct shape on both success and failure
- POST /api/query returns 422 on empty or missing question field
