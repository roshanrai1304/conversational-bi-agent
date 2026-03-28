import logging
import re
from pathlib import Path

from app.core.exceptions import InvalidSQLOutputError, LLMUnavailableError, UnavailableDataError
from app.core.llm import call_llm
from app.core.sql_validator import detect_semantic_hallucination

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent.parent / "prompts" / "sql_system_prompt.txt"
VALID_SQL_STARTS = ("SELECT", "WITH", "INSERT", "UPDATE", "DELETE")


def _is_unavailable_response(sql: str) -> bool:
    """
    Method 4: detect graceful unavailability response from LLM.
    Intentionally broad — 'unavailable:' will never appear in legitimate SQL.
    Does not require a specific alias name (LLM may vary the alias).
    """
    return "unavailable:" in sql.lower()


def _extract_unavailable_message(sql: str) -> str:
    # Try to extract the message between quotes after UNAVAILABLE:
    match = re.search(r"unavailable:\s*([^'\"]+)", sql, re.IGNORECASE)
    if match:
        return match.group(1).strip().rstrip("'\".,")
    return "This data is not available in the Instacart dataset."


def _load_prompt_template() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _strip_sql(raw: str) -> str:
    sql = raw.strip()
    # Remove markdown code fences if LLM added them anyway
    if sql.startswith("```"):
        lines = sql.splitlines()
        sql = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()
    return sql.rstrip(";").strip()


def generate_sql(question: str, schema: str, error_context: str = "") -> str:
    """
    Convert a natural language question to a DuckDB SQL query.
    Returns a clean SQL string — no markdown, no semicolon.
    Raises: InvalidSQLOutputError if output is not SQL.
    Raises: LLMUnavailableError if no LLM provider responds.
    """
    template = _load_prompt_template()

    error_section = ""
    if error_context:
        error_section = f"Previous attempt failed:\n{error_context}\nPlease correct the SQL."

    system_prompt = template.format(schema=schema, error_context=error_section)

    logger.debug("Generating SQL for question: %s", question)
    raw = call_llm(prompt=question, system=system_prompt)

    sql = _strip_sql(raw)

    # Method 4: LLM returned a graceful unavailability response
    if _is_unavailable_response(sql):
        message = _extract_unavailable_message(sql)
        logger.info("LLM returned unavailability response: %s", message[:100])
        raise UnavailableDataError(message)

    if not sql.upper().startswith(VALID_SQL_STARTS):
        logger.warning("LLM output does not look like SQL: %s", sql[:120])
        raise InvalidSQLOutputError(f"LLM returned non-SQL output: {sql[:120]}")

    # Method 2: detect semantic hallucination via alias inspection (first attempt only)
    if not error_context:
        hallucination_error = detect_semantic_hallucination(sql)
        if hallucination_error:
            logger.warning("Semantic hallucination detected — retrying with correction context")
            return generate_sql(question, schema, error_context=hallucination_error)

    logger.debug("Generated SQL: %s", sql)
    return sql
