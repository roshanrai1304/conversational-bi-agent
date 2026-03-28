import logging

import duckdb
import pandas as pd

from app.core.exceptions import InvalidSQLOutputError, LLMUnavailableError

logger = logging.getLogger(__name__)

RETRYABLE_ERRORS = (duckdb.CatalogException, duckdb.ParserException)


def run_query(sql: str, con: duckdb.DuckDBPyConnection) -> dict:
    """
    Execute SQL on DuckDB. Returns standard result dict.
    Never raises — all errors are returned in the dict.
    """
    try:
        df: pd.DataFrame = con.execute(sql).df()
        logger.info("Query returned %d rows", len(df))
        return {"success": True, "data": df, "error": None}
    except RETRYABLE_ERRORS as e:
        logger.error("DuckDB error (retryable): %s", str(e))
        return {"success": False, "data": None, "error": str(e), "retryable": True}
    except duckdb.IOException as e:
        logger.error("DuckDB IO error (not retryable): %s", str(e))
        return {"success": False, "data": None, "error": str(e), "retryable": False}
    except Exception as e:
        logger.error("Unexpected query error: %s", str(e))
        return {"success": False, "data": None, "error": str(e), "retryable": False}


def run_query_with_retry(
    question: str,
    sql: str,
    con: duckdb.DuckDBPyConnection,
    schema: str,
) -> dict:
    """
    Runs query. On retryable failure, sends error back to LLM for one corrected attempt.
    Returns standard result dict — never raises.
    """
    from app.core.sql_generator import generate_sql

    result = run_query(sql, con)

    if result["success"]:
        return result

    if not result.get("retryable", False):
        return result

    logger.warning("Query failed. Retrying with error context sent to LLM.")
    try:
        corrected_sql = generate_sql(
            question=question,
            schema=schema,
            error_context=f"SQL: {sql}\nError: {result['error']}",
        )
        return run_query(corrected_sql, con)
    except (InvalidSQLOutputError, LLMUnavailableError) as e:
        logger.error("Retry SQL generation failed: %s", str(e))
        return {"success": False, "data": None, "error": str(e), "retryable": False}
