# Logging Rules

## Framework
Use Python's built-in `logging` module. Never use `print()` in `core/` modules.
`print()` is only acceptable inside `app.py` for Streamlit debug output during development.

---

## Setup

Configure logging once at app startup in `app.py`:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S"
)
```

In every `core/` module, get a module-level logger:

```python
import logging
logger = logging.getLogger(__name__)
```

`__name__` resolves to `core.db`, `core.llm`, etc. — keeps log output traceable.

---

## Log Levels

| Level | When to Use | Example |
|---|---|---|
| `DEBUG` | Internals useful during development | Generated SQL, full prompt sent to LLM |
| `INFO` | Normal successful operations | "DuckDB views registered", "Groq API call succeeded" |
| `WARNING` | Degraded but recoverable state | "Groq failed, falling back to Ollama", "Retry attempt 1" |
| `ERROR` | Operation failed, returned error to caller | "SQL execution failed: column not found" |
| `CRITICAL` | App cannot start or function at all | "CSV files not found in data/ — cannot load database" |

---

## What to Log

### core/db.py
```python
logger.info("Registering DuckDB views from: %s", data_dir)
logger.info("View registered: %s (%d rows)", view_name, row_count)
logger.critical("CSV not found: %s", filepath)  # app cannot continue
```

### core/llm.py
```python
logger.debug("Sending prompt to Groq (%d chars)", len(prompt))
logger.info("Groq API call succeeded in %.2fs", elapsed)
logger.warning("Groq API error: %s. Retrying...", str(e))
logger.warning("Groq retry failed. Switching to Ollama fallback.")
logger.error("Ollama unreachable: %s", str(e))
```

### core/sql_generator.py
```python
logger.debug("Generated SQL: %s", sql)
logger.warning("LLM output does not look like SQL: %s", raw_output[:100])
```

### core/query_runner.py
```python
logger.debug("Executing SQL: %s", sql)
logger.info("Query returned %d rows in %.2fs", len(df), elapsed)
logger.warning("Query failed. Triggering retry with error context.")
logger.error("Query execution error: %s", str(e))
```

---

## What NOT to Log

- API keys or any part of the `.env` file
- Full user queries in ERROR level (log at DEBUG to avoid noise)
- Full LLM prompts at INFO level — use DEBUG (they are large)
- Duplicate messages — if a function calls another that already logs, don't re-log the same event

---

## Log Format Reference

Output will look like:
```
10:32:14 | INFO     | core.db   | View registered: orders (3421083 rows)
10:32:15 | INFO     | core.db   | View registered: order_products_prior (32434489 rows)
10:32:18 | INFO     | core.llm  | Groq API call succeeded in 1.24s
10:32:18 | DEBUG    | core.sql_generator | Generated SQL: SELECT d.department, COUNT(*) ...
10:32:19 | INFO     | core.query_runner | Query returned 21 rows in 0.43s
10:35:02 | WARNING  | core.llm  | Groq API error: rate limit. Retrying...
10:35:03 | WARNING  | core.llm  | Groq retry failed. Switching to Ollama fallback.
```

---

## During Demo

Before demoing, set log level to `WARNING` to reduce console noise:

```python
logging.basicConfig(level=logging.WARNING, ...)
```

Or set per-module:
```python
logging.getLogger("core.llm").setLevel(logging.WARNING)
```

During development and debugging, set to `DEBUG` to see full prompts and SQL.
