import logging

import pandas as pd

logger = logging.getLogger(__name__)

TIME_COLUMNS = {"hour", "dow", "day", "week", "month", "order_hour_of_day", "order_dow", "order_number"}


def select_chart_type(df: pd.DataFrame) -> str:
    """
    Inspect DataFrame shape and column types.
    Returns one of: "bar", "line", "pie", "table", "metric"
    Never returns None.
    """
    if df is None or df.empty:
        return "table"

    num_rows, num_cols = df.shape
    col_names = [c.lower() for c in df.columns]

    # Single value — big number display
    if num_rows == 1 and num_cols == 1:
        return "metric"

    # Time-series — line chart
    if any(c in TIME_COLUMNS for c in col_names):
        return "line"

    # 3+ columns — always a table
    if num_cols >= 3:
        return "table"

    # 2 columns: one string, one numeric
    if num_cols == 2:
        numeric_cols = df.select_dtypes(include="number").columns
        if len(numeric_cols) == 1:
            if num_rows <= 8:
                return "pie"
            return "bar"

    logger.debug("Chart type defaulted to table for shape %s", df.shape)
    return "table"
