import json
import logging

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

logger = logging.getLogger(__name__)


def _fig_to_dict(fig: go.Figure) -> dict:
    """Serialize a Plotly figure to a plain JSON-safe dict.
    fig.to_dict() keeps numpy types; json.loads(fig.to_json()) converts them all.
    """
    return json.loads(fig.to_json())


def _infer_title(df: pd.DataFrame) -> str:
    return " vs ".join(col.replace("_", " ").title() for col in df.columns)


def build_chart(df: pd.DataFrame, chart_type: str) -> dict:
    """
    Build a Plotly figure for the given DataFrame and chart type.
    Returns the figure as a plain dict (JSON-serializable via fig.to_dict()).
    Falls back to a table figure if chart building fails.
    """
    try:
        return _build(df, chart_type)
    except Exception as e:
        logger.warning("Chart build failed for type '%s': %s. Falling back to table.", chart_type, str(e))
        return _build_table(df)


def _build(df: pd.DataFrame, chart_type: str) -> dict:
    cols = list(df.columns)
    title = _infer_title(df)

    if chart_type == "metric":
        value = df.iloc[0, 0]
        col_name = cols[0].replace("_", " ").title()
        fig = go.Figure(go.Indicator(
            mode="number",
            value=float(value),
            title={"text": col_name},
        ))
        fig.update_layout(height=200)
        return _fig_to_dict(fig)

    if chart_type == "bar":
        x_col, y_col = cols[0], cols[1]
        fig = px.bar(df, x=x_col, y=y_col, title=title)
        fig.update_layout(xaxis_tickangle=-35)
        return _fig_to_dict(fig)

    if chart_type == "line":
        x_col, y_col = cols[0], cols[1]
        fig = px.line(df, x=x_col, y=y_col, title=title, markers=True)
        return _fig_to_dict(fig)

    if chart_type == "pie":
        label_col, value_col = cols[0], cols[1]
        fig = px.pie(df, names=label_col, values=value_col, title=title)
        return _fig_to_dict(fig)

    return _build_table(df)


def _build_table(df: pd.DataFrame) -> dict:
    fig = go.Figure(go.Table(
        header=dict(
            values=[f"<b>{c}</b>" for c in df.columns],
            fill_color="#1e293b",
            font=dict(color="white", size=13),
            align="left",
        ),
        cells=dict(
            values=[df[c].tolist() for c in df.columns],
            fill_color=[["#ffffff", "#f1f5f9"] * (len(df) // 2 + 1)],
            align="left",
            font=dict(color="#0f172a", size=13),
        ),
    ))
    fig.update_layout(
        margin=dict(l=0, r=0, t=10, b=0),
        paper_bgcolor="#ffffff",
    )
    return _fig_to_dict(fig)
