# API Rules

## Overview

This project has two API layers:
1. **REST API** — FastAPI endpoints consumed by the React frontend
2. **Internal Python API** — function contracts between `app/core/` modules

All backend dependencies are managed via **uv** with `requirements.txt`.

**Workflow to add a new package:**
```bash
# 1. Add it to requirements.in
# 2. Recompile
uv pip compile requirements.in -o requirements.txt
# 3. Sync your environment
uv pip sync requirements.txt
```

Never use `pip install <package>` directly — it bypasses the lockfile.

---

## REST API (FastAPI)

### Base URL
- Development: `http://localhost:8000`
- All routes prefixed with `/api`

### Endpoints

#### `POST /api/query`

The single endpoint the frontend calls.

**Request**
```json
{
  "question": "Which department has the highest reorder rate?"
}
```

**Response — Success**
```json
{
  "success": true,
  "sql": "SELECT d.department, ROUND(AVG(op.reordered), 3) as reorder_rate ...",
  "chart_type": "bar",
  "plotly_figure": {
    "data": [{ "type": "bar", "x": [...], "y": [...] }],
    "layout": { "title": "Reorder Rate by Department", "xaxis": {}, "yaxis": {} }
  },
  "table_data": [
    { "department": "produce", "reorder_rate": 0.724 }
  ],
  "row_count": 21,
  "error": null
}
```

**Response — Failure**
```json
{
  "success": false,
  "sql": "SELECT ...",
  "chart_type": null,
  "plotly_figure": null,
  "table_data": null,
  "row_count": 0,
  "error": "Column 'reorder_rate' does not exist"
}
```

**HTTP Status Codes**
| Status | When |
|---|---|
| `200` | Always — even on query failure. Errors are in the response body. |
| `422` | Request body validation failed (empty question, wrong type) |
| `500` | Unhandled server error — should not happen in normal operation |

> Always return HTTP 200 for query failures. The frontend inspects `success` field, not HTTP status.

### CORS Configuration

Allow the Vite dev server origin in `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
```

### Request / Response Models (Pydantic)

Define in `app/routes/query.py`:

```python
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    force_execute: bool = False  # bypass slow query warning when True

class QueryResponse(BaseModel):
    success: bool
    sql: str | None
    chart_type: str | None   # 'bar'|'line'|'pie'|'table'|'metric'|'unavailable'|'warning'|'running'|None
    plotly_figure: dict | None
    table_data: list[dict] | None
    row_count: int
    summary: str | None      # AI-generated plain-English explanation
    warning: dict | None     # set when chart_type='warning': {message, suggestions}
    error: str | None
```

### FastAPI Route — Full Pipeline

```
Step 1: generate_sql()        → SQL string
  ├── UnavailableDataError    → return chart_type='unavailable'
  ├── LLMUnavailableError     → return success=False
  └── InvalidSQLOutputError   → return success=False

Step 2: detect_slow_query()   → warning dict or None
  └── warning found AND NOT force_execute
                              → return chart_type='warning', warning=dict

Step 3: run_query_with_retry() → DataFrame
  └── failure                 → return success=False

Step 4: select_chart_type() + build_chart() → Plotly figure
Step 5: generate_summary()    → plain-English explanation (non-blocking)
```

```python
try:
    sql = generate_sql(question, schema)
except UnavailableDataError as e:
    # Method 4: data concept doesn't exist — return structured unavailability card
    return QueryResponse(success=True, chart_type="unavailable", summary=e.message)
except LLMUnavailableError as e:
    return QueryResponse(success=False, error=str(e))
except InvalidSQLOutputError as e:
    return QueryResponse(success=False, error=str(e))
```

**`chart_type='unavailable'`** is a valid success response — the system worked correctly, it just identified that the requested data doesn't exist. The frontend renders `UnavailableCard` for this case.

**Pipeline steps (on success):**
1. `generate_sql()` — NL → SQL (with Method 2 + 4 guards)
2. `run_query_with_retry()` — SQL → DataFrame
3. `select_chart_type()` + `build_chart()` — DataFrame → Plotly figure
4. `generate_summary()` — non-blocking LLM call for plain-English explanation

---

## Internal Python API (core/ modules)

### Naming Conventions
- Public functions: `verb_noun` in `snake_case` — `generate_sql()`, `run_query()`, `select_chart_type()`
- Private helpers: prefix with underscore — `_strip_sql()`, `_build_prompt()`
- Classes: `PascalCase` — `LLMClient`
- Constants: `UPPER_SNAKE_CASE` — `GROQ_MODEL`, `MAX_RETRIES`

### Parameters
- Positional params for required inputs, keyword params for optional config
- Never use `**kwargs` in public functions
- Pass `duckdb.DuckDBPyConnection` as a parameter, not as a global

```python
# Good — testable, explicit
def run_query(sql: str, con: duckdb.DuckDBPyConnection) -> dict: ...

# Bad — global state, untestable
con = duckdb.connect()
def run_query(sql: str) -> dict: ...
```

### Standard Return Shape

All functions that can fail return a dict — never raise to the caller:

```python
# Success
{"success": True, "data": df, "error": None}

# Failure
{"success": False, "data": None, "error": "Column 'x' not found"}
```

Functions that cannot fail return plain values (str, list, dict).

---

## Module Contracts

### `app/core/llm.py`

```python
def call_llm(prompt: str, system: str = "", max_tokens: int = 500, temperature: float = 0) -> str:
    """
    Call the active LLM provider. Returns raw text response.
    Primary: Groq API. Fallback: Ollama local.
    Raises: LLMUnavailableError if both providers fail.
    """
```

- Provider set via `LLM_PROVIDER` env var (`groq` | `ollama`)
- Model names set via `GROQ_MODEL` and `OLLAMA_MODEL` env vars
- Never hardcode model names inside `llm.py`
- 1 retry on connection error, then fall back to Ollama
- Raise `LLMUnavailableError` only if both providers fail
- `max_tokens` and `temperature` are caller-controlled — callers pass their own values per use case:

| Caller | `max_tokens` | `temperature` | Reason |
|---|---|---|---|
| `sql_generator.py` | 500 (default) | 0 (default) | Deterministic SQL |
| `summarizer.py` | 300 | 0.3 | Longer natural language, slight variation |

**Groq usage:**
```python
client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))
response = client.chat.completions.create(
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ],
    temperature=temperature,
    max_tokens=max_tokens
)
return response.choices[0].message.content
```

**Ollama usage:**
```python
response = requests.post(
    "http://localhost:11434/api/generate",
    json={"model": os.getenv("OLLAMA_MODEL"), "prompt": full_prompt, "stream": False}
)
return response.json()["response"]
```

---

### `app/core/sql_validator.py`

Implements **Method 2 — Schema Column Validation** (semantic hallucination detection).

```python
UNAVAILABLE_CONCEPTS = frozenset({
    'revenue', 'price', 'cost', 'spend', 'profit',
    'margin', 'discount', 'sales', 'amount', 'value',
    'earning', 'income', 'payment', 'transaction', 'sale',
})

def detect_semantic_hallucination(sql: str) -> str | None:
    """
    Inspect SELECT aliases for financial concepts that don't exist in this dataset.
    Returns an error string (sent back to LLM as error_context) if detected, None if clean.
    """
```

**How it works:**
- Extracts all `AS alias_name` patterns from the SQL using regex
- Splits each alias on `_` and checks if any word is in `UNAVAILABLE_CONCEPTS`
- If matched (e.g. `avg_revenue_per_order` → `revenue` found) → returns an error string that:
  1. Names the alias and concept
  2. States no financial columns exist in this dataset
  3. Instructs the LLM to use the `UNAVAILABLE:` response format instead

**Only runs on first attempt** (`not error_context`) — prevents infinite retry loops.

**Method 6 — `detect_slow_query(sql)` (also in this file):**

```python
def detect_slow_query(sql: str) -> SlowQueryWarning | None:
    """
    Detect SQL patterns that will be slow on this dataset before executing them.
    Returns a warning dict {message, suggestions} or None if the query is fast.
    Called by the route AFTER SQL generation, BEFORE DuckDB execution.
    """
```

Detected patterns:
| Pattern | Why slow | Suggestions shown |
|---|---|---|
| `all_order_products JOIN all_order_products` | Self-join on 33M rows — O(N²) pair expansion | Anchored co-occurrence questions |
| `CROSS JOIN` on large tables | Cartesian product | Simpler reformulations |

`force_execute: bool` in `QueryRequest` bypasses this check when `True` — set by the frontend when the user clicks "Run anyway" on the warning card.

---

### `app/core/sql_generator.py`

```python
def generate_sql(question: str, schema: str, error_context: str = "") -> str:
    """
    Convert natural language question to a DuckDB SQL query.
    Returns a clean SQL string — no markdown, no semicolon.
    Raises: InvalidSQLOutputError if output is not SQL.
    Raises: UnavailableDataError if data concept does not exist in dataset.
    Raises: LLMUnavailableError if no LLM provider responds.
    """
```

**Processing order after LLM returns raw output:**

```
1. _strip_sql(raw)                          — remove fences, semicolons

2. _is_unavailable_response(sql)?           — Method 4 check
   └── Yes → _extract_unavailable_message() → raise UnavailableDataError

3. Starts with SELECT/WITH?
   └── No  → raise InvalidSQLOutputError

4. detect_semantic_hallucination(sql)?      — Method 2 check (first attempt only)
   └── Found → re-call generate_sql() with hallucination_error as error_context
               (second attempt skips Method 2 to avoid infinite loop)

5. Return clean SQL
```

**`_is_unavailable_response` detection:**
- Checks if `"unavailable:"` appears anywhere in the SQL (case-insensitive)
- Intentionally broad — the word `unavailable:` never appears in legitimate SQL
- Does NOT require a specific alias name — LLM may vary the formatting

**Prompt rules that support this:**
- `prompts/sql_system_prompt.txt` has an "Unavailable Data" section listing all financial concepts and the exact `SELECT 'UNAVAILABLE: ...' AS explanation` format to return

---

### `app/core/query_runner.py`

```python
def run_query(sql: str, con: duckdb.DuckDBPyConnection) -> dict:
    """Execute SQL. Returns standard result dict. Never raises."""

def run_query_with_retry(
    question: str,
    sql: str,
    con: duckdb.DuckDBPyConnection,
    schema: str
) -> dict:
    """Runs query. On failure, sends error back to LLM for one corrected attempt."""
```

---

### `app/core/chart_selector.py`

```python
def select_chart_type(df: pd.DataFrame) -> str:
    """
    Inspect DataFrame shape and column types.
    Returns one of: "bar", "line", "pie", "table", "metric"
    Never returns None.
    """
```

| Condition | Chart Type |
|---|---|
| 1 row, 1 numeric column | `"metric"` |
| 2 columns: str + numeric, <= 10 rows | `"pie"` |
| 2 columns: str + numeric, > 10 rows | `"bar"` |
| Column named `hour`, `dow`, `day`, `week` | `"line"` |
| 3+ columns | `"table"` |
| Fallback | `"table"` |

---

### `app/core/summarizer.py`

```python
def generate_summary(question: str, sql: str, sample_rows: list[dict]) -> str | None:
    """
    Generate a plain-English 4-5 sentence summary covering approach, key findings, and insight.
    Returns None on any failure — summary is optional, never blocks the response.
    """
```

- Called after the query succeeds in `routes/query.py` — Step 4 of the pipeline
- Uses `call_llm` with `max_tokens=300, temperature=0.3`
- System prompt instructs 4-5 sentences: data sources used, aggregation performed, key finding with numbers, pattern/trend, business implication
- Starts with "To answer this, I've..." or "I analysed..."
- Wraps in `try/except` — always returns `None` on failure, never raises
- `None` is valid — `summary` field in `QueryResponse` is optional

---

### `app/core/chart_builder.py`

```python
def build_chart(df: pd.DataFrame, chart_type: str) -> dict:
    """
    Build a Plotly figure for the given DataFrame and chart type.
    Returns the figure as a plain dict (JSON-serializable).
    Never returns None — falls back to empty figure on error.
    """
```

- Use `plotly.express` for simple charts (bar, line, pie)
- Use `fig.to_dict()` to serialize — not `fig.to_json()` (FastAPI handles JSON encoding)
- Always set a title derived from column names — the frontend displays it

---

### `app/core/db.py`

```python
def load_database(data_dir: str = None) -> duckdb.DuckDBPyConnection:
    """
    Load all 6 CSVs as DuckDB TABLEs (not views).
    Materializes all_order_products as TABLE (UNION of prior + train).
    Creates ART indexes on join columns.
    Returns a ready-to-use connection.
    Raises: DataLoadError if any CSV is missing.
    """

def get_schema_string(con: duckdb.DuckDBPyConnection) -> str:
    """
    Return schema as a formatted string for LLM prompt injection.
    Includes: table name, columns, types, approximate row count.
    """
```

**Why TABLEs not VIEWs:**
- Views re-read the CSV on every query. Tables store data in DuckDB's columnar format in RAM.
- `all_order_products` is pre-materialized as a TABLE — no UNION computation per query
- ART indexes created at startup: `order_id` + `product_id` on `all_order_products`, `user_id` on `orders`
- Startup takes 15–30s (one-time cost), but all queries run faster

**Table names — use exactly these in SQL and prompts:**

| View Name | Source File |
|---|---|
| `orders` | orders.csv |
| `order_products_prior` | order_products__prior.csv |
| `order_products_train` | order_products__train.csv |
| `all_order_products` | UNION view of prior + train |
| `products` | products.csv |
| `aisles` | aisles.csv |
| `departments` | departments.csv |
