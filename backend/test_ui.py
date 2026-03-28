"""
Test UI — Streamlit interface for testing the BI Agent backend.
Calls the FastAPI server at localhost:8000.

Run:
    # Terminal 1 — start the backend
    source .venv/bin/activate
    uvicorn main:app --reload --port 8000

    # Terminal 2 — start this UI
    source .venv/bin/activate
    streamlit run test_ui.py
"""

import requests
import streamlit as st
import plotly.graph_objects as go

API_URL = "http://localhost:8000/api/query"

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="BI Agent — Test UI",
    page_icon="📊",
    layout="wide",
)

st.title("📊 BI Agent — Test UI")
st.caption("Testing interface for the FastAPI backend. Make sure the server is running on port 8000.")

# ── Sidebar: sample questions ─────────────────────────────────────────────────
st.sidebar.header("Sample Questions")
sample_questions = [
    "How many total orders are there?",
    "What are the top 10 most ordered products?",
    "Which department has the highest reorder rate?",
    "Show me the number of orders by hour of day",
    "Which day of the week has the most orders?",
    "What are the top 10 aisles by reorder rate?",
    "How many unique users placed orders?",
    "What is the average number of products per order?",
    "What is the average days between orders?",
    "Show top 5 products in the produce department",
]

selected = st.sidebar.selectbox(
    "Pick a sample question",
    ["— choose one —"] + sample_questions,
)

# ── Main input ────────────────────────────────────────────────────────────────
if selected != "— choose one —":
    default_question = selected
else:
    default_question = ""

question = st.text_input(
    "Ask a question about the Instacart data",
    value=default_question,
    placeholder="e.g. Which department has the highest reorder rate?",
)

ask = st.button("Ask", type="primary", disabled=not question.strip())

# ── Backend health check ──────────────────────────────────────────────────────
with st.sidebar:
    st.divider()
    st.subheader("Backend Status")
    try:
        health = requests.get("http://localhost:8000/health", timeout=2)
        if health.status_code == 200:
            st.success("Server is running")
        else:
            st.error(f"Server returned {health.status_code}")
    except requests.exceptions.ConnectionError:
        st.error("Cannot reach server on port 8000")
        st.code("uvicorn main:app --reload --port 8000")

# ── Query and results ─────────────────────────────────────────────────────────
if ask and question.strip():
    with st.spinner("Generating SQL and querying data..."):
        try:
            response = requests.post(
                API_URL,
                json={"question": question.strip()},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.ConnectionError:
            st.error("Cannot connect to the backend. Is the server running on port 8000?")
            st.stop()
        except requests.exceptions.Timeout:
            st.error("Request timed out after 30 seconds. The query may be too complex.")
            st.stop()
        except Exception as e:
            st.error(f"Unexpected error: {e}")
            st.stop()

    # ── Success path ──────────────────────────────────────────────────────────
    if data["success"]:
        col1, col2, col3 = st.columns(3)
        col1.metric("Rows returned", data["row_count"])
        col2.metric("Chart type", data["chart_type"])
        col3.metric("Status", "Success")

        st.divider()

        # Chart
        if data["plotly_figure"]:
            fig = go.Figure(data["plotly_figure"])
            st.plotly_chart(fig, use_container_width=True)

        # Raw table
        if data["table_data"]:
            with st.expander("Raw table data", expanded=data["chart_type"] == "table"):
                st.dataframe(data["table_data"], use_container_width=True)

        # SQL
        if data["sql"]:
            with st.expander("Generated SQL"):
                st.code(data["sql"], language="sql")

    # ── Failure path ──────────────────────────────────────────────────────────
    else:
        st.error(f"Query failed: {data['error']}")

        if data.get("sql"):
            with st.expander("SQL that failed"):
                st.code(data["sql"], language="sql")

        st.info("Try rephrasing the question or pick a sample from the sidebar.")
