# Error Handling Rules

## Core Principle
Never let an unhandled exception reach the Streamlit UI.
Every function that can fail must return a structured result — the UI layer decides how to display it.

---

## Error Layers

### Layer 1 — LLM Errors (core/llm.py)
These are network/API failures. Handle here, do not propagate raw.

| Error | Action |
|---|---|
| `groq.APIConnectionError` | Retry once, then fall back to Ollama |
| `groq.RateLimitError` | Fall back to Ollama immediately, log warning |
| `groq.APIStatusError` | Log error + status code, fall back to Ollama |
| Ollama connection refused | Raise `LLMUnavailableError` |
| Both providers fail | Raise `LLMUnavailableError` with message for UI |

```python
class LLMUnavailableError(Exception):
    """Raised when both Groq and Ollama are unreachable."""
    pass
```

### Layer 2 — SQL Generation Errors (core/sql_generator.py)
These are LLM output quality failures (malformed SQL, empty response).

| Error | Action |
|---|---|
| LLM returns empty string | Return `{"success": False, "error": "LLM returned empty response"}` |
| LLM output does not start with SELECT/WITH | Return error dict — do not attempt execution |
| `LLMUnavailableError` caught here | Surface it as error dict to caller |

### Layer 3 — Query Execution Errors (core/query_runner.py)
These are SQL execution failures in DuckDB.

| Error | Action |
|---|---|
| `duckdb.CatalogException` | Column/table not found — trigger retry with error context |
| `duckdb.ParserException` | Malformed SQL — trigger retry with error context |
| `duckdb.IOException` | CSV file missing — do not retry, return descriptive error |
| Any other exception | Log + return error dict, no retry |

```python
def run_query(sql: str, con) -> dict:
    try:
        df = con.execute(sql).df()
        return {"success": True, "data": df, "error": None}
    except Exception as e:
        logger.error("Query execution failed: %s", str(e))
        return {"success": False, "data": None, "error": str(e)}
```

### Layer 4 — UI Errors (app.py)
Display errors gracefully. Never show raw tracebacks to the user.

```python
result = run_query_with_retry(question, sql, con, schema)
if not result["success"]:
    st.error(f"Could not answer that question. Reason: {result['error']}")
    st.info("Try rephrasing your question or simplifying it.")
else:
    # render chart
```

---

## Retry Logic

### SQL Retry (one attempt only)

```python
def run_query_with_retry(question, sql, con, schema):
    result = run_query(sql, con)
    if not result["success"]:
        logger.warning("First SQL attempt failed. Retrying with error context.")
        corrected_sql = generate_sql(
            question=question,
            schema=schema,
            error_context=f"Previous SQL failed with: {result['error']}\nPrevious SQL: {sql}"
        )
        result = run_query(corrected_sql, con)
    return result
```

Rules:
- Max 1 retry — do not loop
- Retry only for `CatalogException` and `ParserException` (fixable by LLM)
- Do not retry for `IOException` (CSV missing — LLM cannot fix this)

### LLM Retry (one attempt only)

```python
try:
    return call_groq(prompt, system)
except groq.APIConnectionError:
    logger.warning("Groq connection failed. Retrying once.")
    try:
        return call_groq(prompt, system)
    except Exception:
        logger.warning("Groq retry failed. Falling back to Ollama.")
        return call_ollama(prompt, system)
```

---

## Custom Exceptions

Define in `core/exceptions.py`:

```python
class LLMUnavailableError(Exception):
    """Both Groq and Ollama are unreachable."""
    pass

class InvalidSQLOutputError(Exception):
    """LLM returned output that is not valid SQL."""
    pass

class DataLoadError(Exception):
    """One or more CSV files could not be loaded into DuckDB."""
    pass

class UnavailableDataError(Exception):
    """
    Raised when the requested concept has no columns in this dataset.
    Triggered by Method 2 (semantic hallucination → retry → LLM returns UNAVAILABLE response)
    or Method 4 (LLM directly returns UNAVAILABLE response from prompt rules).
    The route catches this and returns chart_type='unavailable' — NOT an error state.
    """
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
```

---

## What NOT to Do

- Do not use bare `except:` — always catch specific exception types or `Exception` at minimum
- Do not silently swallow errors — always log before returning an error dict
- Do not raise exceptions from `query_runner.py` — it must always return a dict
- Do not show `str(traceback)` in the Streamlit UI
- Do not retry more than once — cascading retries make the app feel broken

---

## Logging in Error Paths

Always log before returning an error result:

```python
# Good
except duckdb.CatalogException as e:
    logger.error("DuckDB catalog error (column/table not found): %s", str(e))
    return {"success": False, "data": None, "error": str(e)}

# Bad
except Exception:
    return {"success": False, "data": None, "error": "something went wrong"}
```

Include the actual exception message in both the log and the returned error string.
