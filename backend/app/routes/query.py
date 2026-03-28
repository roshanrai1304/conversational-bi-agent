import json
import logging

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.core.chart_builder import build_chart
from app.core.chart_selector import select_chart_type
from app.core.exceptions import InvalidSQLOutputError, LLMUnavailableError, UnavailableDataError
from app.core.query_runner import run_query_with_retry
from app.core.sql_generator import generate_sql
from app.core.sql_validator import detect_slow_query
from app.core.summarizer import generate_summary

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    force_execute: bool = False  # bypass slow query warning when True


class QueryResponse(BaseModel):
    success: bool
    sql: str | None = None
    chart_type: str | None = None
    plotly_figure: dict | None = None
    table_data: list[dict] | None = None
    row_count: int = 0
    summary: str | None = None
    warning: dict | None = None   # set when chart_type='warning'
    error: str | None = None


@router.get("/schema")
async def schema(req: Request) -> dict:
    return {"schema": req.app.state.schema}


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest, req: Request) -> QueryResponse:
    con = req.app.state.con
    schema = req.app.state.schema

    logger.info("Received question: %s", request.question)

    # Step 1: Generate SQL
    try:
        sql = generate_sql(question=request.question, schema=schema)
    except UnavailableDataError as e:
        # Method 4: LLM correctly identified that the data doesn't exist
        logger.info("Data unavailable: %s", e.message)
        return QueryResponse(success=True, chart_type="unavailable", summary=e.message)
    except LLMUnavailableError as e:
        logger.error("LLM unavailable: %s", str(e))
        return QueryResponse(success=False, error=str(e))
    except InvalidSQLOutputError as e:
        logger.error("Invalid SQL output: %s", str(e))
        return QueryResponse(success=False, error=str(e))

    # Step 2: Slow query detection (skipped if force_execute=True)
    if not request.force_execute:
        warning = detect_slow_query(sql)
        if warning:
            logger.warning("Slow query intercepted — returning warning to user")
            return QueryResponse(
                success=True,
                sql=sql,
                chart_type="warning",
                warning=dict(warning),
            )

    # Step 3: Execute SQL (with one retry on failure)
    result = run_query_with_retry(
        question=request.question,
        sql=sql,
        con=con,
        schema=schema,
    )

    if not result["success"]:
        return QueryResponse(success=False, sql=sql, error=result["error"])

    df = result["data"]

    # Step 4: Select chart type and build figure
    chart_type = select_chart_type(df)
    plotly_figure = build_chart(df, chart_type)
    table_data = json.loads(df.to_json(orient="records"))

    # Step 5: Generate plain-English summary (non-blocking — returns None on failure)
    summary = generate_summary(
        question=request.question,
        sql=sql,
        sample_rows=table_data,
    )

    logger.info("Returning chart_type=%s, rows=%d, summary=%s", chart_type, len(df), bool(summary))

    return QueryResponse(
        success=True,
        sql=sql,
        chart_type=chart_type,
        plotly_figure=plotly_figure,
        table_data=table_data,
        row_count=len(df),
        summary=summary,
    )
