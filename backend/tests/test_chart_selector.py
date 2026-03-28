import pandas as pd
from app.core.chart_selector import select_chart_type


def test_single_value_returns_metric(single_value_df):
    assert select_chart_type(single_value_df) == "metric"


def test_time_column_returns_line(time_series_df):
    assert select_chart_type(time_series_df) == "line"


def test_two_col_many_rows_returns_bar(two_col_df):
    assert select_chart_type(two_col_df) == "bar"


def test_two_col_few_rows_returns_pie():
    df = pd.DataFrame({"department": ["a", "b", "c"], "count": [10, 20, 30]})
    assert select_chart_type(df) == "pie"


def test_three_cols_returns_table(multi_col_df):
    assert select_chart_type(multi_col_df) == "table"


def test_empty_df_returns_table():
    assert select_chart_type(pd.DataFrame()) == "table"


def test_never_returns_none(two_col_df, time_series_df, single_value_df, multi_col_df):
    for df in [two_col_df, time_series_df, single_value_df, multi_col_df]:
        result = select_chart_type(df)
        assert result is not None
        assert result in {"bar", "line", "pie", "table", "metric"}
