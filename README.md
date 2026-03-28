# BI Agent — Conversational Analytics for Instacart Data

A conversational BI agent that accepts natural language questions and returns
SQL query results as interactive charts, tables, and plain-English explanations.
No SQL knowledge required from the user.


---

## What It Does

Ask questions in plain English. Get charts, tables, and insights.

```
"Which department has the highest reorder rate?"
"What are the top 10 products ordered on Sunday mornings?"
"Show me orders by hour of day"
"How many customers have placed only one order?"
"What products are most often bought with Organic Bananas?"
```

The system translates each question into SQL, executes it against a 33M-row
Instacart grocery dataset, and returns results as interactive Plotly charts
with a plain-English summary explaining the approach and key finding.

---

## How to Run

### Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- [uv](https://docs.astral.sh/uv/) — Python package manager
- A free [Groq API key](https://console.groq.com)
- The [Instacart Market Basket Analysis dataset](https://www.kaggle.com/datasets/psparks/instacart-market-basket-analysis)

### 1. Place the Data

Download the dataset and place the 6 CSV files in the `data/` directory at the project root:

```
data/
├── orders.csv
├── order_products__prior.csv
├── order_products__train.csv
├── products.csv
├── aisles.csv
└── departments.csv
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
uv pip sync requirements.txt

# Configure environment
cp .env.example .env
# Open .env and set your GROQ_API_KEY
```

`.env` contents:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
OLLAMA_MODEL=defog/sqlcoder-7b-2
DATA_DIR=../data
```

Start the backend:
```bash
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

The server loads all 6 CSVs into memory at startup — this takes **15–30 seconds**.
You will see log lines like `Table loaded: all_order_products` when it is ready.

API available at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Application opens at: `http://localhost:5173`

### 4. (Optional) Local LLM Fallback

If you want the system to work without internet access, pull the fallback model:

```bash
ollama pull defog/sqlcoder-7b-2
```

Set `LLM_PROVIDER=ollama` in `.env` to use it as the primary, or leave it as
`groq` — the system falls back automatically if Groq is unreachable.


---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser  (http://localhost:5173)                               │
│                                                                 │
│  React 18 + TypeScript + Tailwind CSS                          │
│  ┌────────────┐  ┌─────────────────────────────────────────┐  │
│  │  Sidebar   │  │  Chat Area                              │  │
│  │            │  │  ┌──────────────────────────────────┐   │  │
│  │ Dashboard  │  │  │ User bubble (question)           │   │  │
│  │ History    │  │  │ ResultCard (chart + summary)     │   │  │
│  │ Reports    │  │  │   ├── PlotlyChart / HTMLTable    │   │  │
│  │            │  │  │   ├── Summary paragraph          │   │  │
│  │            │  │  │   └── VIEW SQL toggle            │   │  │
│  └────────────┘  │  └──────────────────────────────────┘   │  │
│                  │  [ Ask a question...            ] [▶]    │  │
│                  └─────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/query
                           │ { question: "...", force_execute: false }
┌──────────────────────────▼──────────────────────────────────────┐
│  FastAPI + Uvicorn  (http://localhost:8000)                     │
│                                                                 │
│  Step 1 ─ SQL Generation                                        │
│    LLM Client ──► Groq API (Llama 3.3 70B)  [primary]         │
│                    └──► Ollama SQLCoder 7B   [fallback]         │
│    ├── Semantic hallucination check (alias inspection)          │
│    ├── UNAVAILABLE data detection (financial concepts)          │
│    └── Clean SQL string                                         │
│                                                                 │
│  Step 2 ─ Slow Query Detection                                  │
│    detect_slow_query(sql) ──► warning card   [if self-join]    │
│                   OR          continue       [if safe]          │
│                                                                 │
│  Step 3 ─ Query Execution                                       │
│    DuckDB (in-process, 33M rows in columnar RAM)               │
│    ├── ART index on order_id, product_id, user_id              │
│    ├── On CatalogException / ParserException → retry once      │
│    └── pandas DataFrame result                                  │
│                                                                 │
│  Step 4 ─ Chart Building                                        │
│    select_chart_type(df) ──► bar/line/pie/table/metric         │
│    build_chart(df, type) ──► Plotly figure → JSON dict         │
│                                                                 │
│  Step 5 ─ Summary Generation (non-blocking)                    │
│    Groq API (4–5 sentence plain-English explanation)           │
│                                                                 │
│  Response: { sql, chart_type, plotly_figure, summary, ... }   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Data Layer (loaded into DuckDB at startup)                     │
│                                                                 │
│  orders              (3.4M rows)  ─┐                           │
│  order_products_prior (32M rows)  ─┤─► all_order_products      │
│  order_products_train  (1.4M rows)─┘    (33.8M rows, TABLE)   │
│  products             (49K rows)                               │
│  aisles               (134 rows)                               │
│  departments           (21 rows)                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Browser Storage (localStorage)                                 │
│  Session history — up to 20 chat sessions                      │
│  Persists across page refreshes, resumable from sidebar        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. DuckDB over SQLite or pandas

The dataset has a 33M-row table (`order_products__prior`). The choice of query engine defines what is possible.

- **pandas** would load 33M rows into RAM as DataFrames (~3–4GB). Groupby operations on that scale are slow and memory-constrained.
- **SQLite** is an OLTP database — row-by-row storage, not optimised for analytical column scans.
- **DuckDB** is an OLAP database — columnar storage, vectorised execution, designed for exactly this workload. It aggregates 33M rows in 1–5 seconds using minimal RAM.

DuckDB also runs in-process — no separate server, no network round-trip between FastAPI and the database.

### 2. CSVs Loaded as DuckDB TABLEs, Not VIEWs

Initially CSVs were registered as DuckDB `VIEW`s (`CREATE VIEW ... AS SELECT * FROM read_csv_auto(...)`). This means every query re-parses the CSV from disk.

Switching to `CREATE TABLE ... AS SELECT * FROM read_csv_auto(...)` stores the data in DuckDB's columnar format in RAM. Additional benefits:
- DuckDB builds row group statistics (min/max per column) used by the query planner to skip irrelevant data chunks
- ART indexes can be created on join columns (`order_id`, `product_id`, `user_id`)
- `all_order_products` (the UNION of prior + train) is materialised once — not recomputed per query

**Tradeoff:** Startup takes 15–30 seconds. Every subsequent query is faster.

### 3. Groq API for LLM (Remote, Not Local)

Llama 3.3 70B produces significantly better SQL than any 7B model that fits on a MacBook. The difference matters most for multi-table joins — the primary challenge of this dataset.

Running a 70B model locally requires ~40GB VRAM. By offloading inference to Groq's API (free tier), all 16GB RAM on the M1 is available for DuckDB and the application.

A local `defog/sqlcoder-7b-2` model (via Ollama) is kept as an automatic fallback for offline use. Same prompt, same output format.

### 4. SQL Generation with `temperature=0`

SQL is a deterministic language. Randomness in generation increases the chance the LLM uses slightly different column names between runs, causing `CatalogException` errors that require a retry.

At `temperature=0` the same question produces the same SQL every time. This minimises retries and makes the system more predictable.

### 5. Two-Layer Hallucination Prevention

The dataset has no financial data (no price, revenue, cost). Without guardrails, the LLM improvises — using `add_to_cart_order * 1.0` as a revenue proxy, which passes SQL validation but returns a wrong answer silently.

Two layers prevent this:

**Layer 1 — Alias inspection (Method 2):** After SQL generation, every `AS alias_name` is checked. If the alias contains a financial term (`revenue`, `price`, `margin`, etc.), the SQL is rejected before execution and regenerated with a correction prompt.

**Layer 2 — Prompt instruction (Method 4):** The system prompt explicitly lists unavailable concepts and instructs the LLM: if asked about these, return `SELECT 'UNAVAILABLE: ...' AS explanation`. The backend detects this pattern and returns a structured `chart_type='unavailable'` response instead of executing the SQL.

### 6. Slow Query Warning Instead of Silent Execution

Product co-occurrence analysis (which products are bought together most) requires a self-join on the 33M-row table — an O(N²) operation that takes 2–5 minutes.

Instead of letting the UI hang with a spinner, the backend detects self-join patterns before execution and returns `chart_type='warning'` with two faster alternative questions and a "Run anyway" option. The user explicitly opts in to the long query — no surprises.

### 7. Plotly Figures Built Server-Side

Chart logic lives in Python, not TypeScript. `plotly.express` on the backend selects axes, colours, and layout based on the DataFrame. The figure is serialised to JSON and rendered on the frontend by `react-plotly.js`.

This avoids duplicating chart-building logic in TypeScript and gives access to Plotly's full Python API (which is more expressive than `plotly.js`).

### 8. Business Term Glossary in the Prompt

Business analysts use vocabulary that doesn't map to table names in the dataset: "customers", "transactions", "SKUs", "categories", "customer segments". Without explicit mapping, the LLM generates SQL referencing tables that don't exist.

The system prompt includes a glossary that maps business terms to actual table/column names:
- `"customer"` → `user_id` in the `orders` table
- `"transaction"` → a row in `all_order_products`
- `"SKU"` → a row in the `products` table
- `"customer segment"` → derived from `order_number` ranges

This converts terminology mismatches from errors into correct answers.

---

## Known Limitations and Failure Modes

### SQL Accuracy

| Failure mode | How it is handled |
|---|---|
| Wrong column/table name (`CatalogException`) | Retry once: error + original SQL sent back to LLM for self-correction |
| Semantic hallucination (valid SQL, wrong logic) | Alias inspection detects financial concepts before execution |
| Question about unavailable data (revenue, price) | Prompt instructs LLM to return structured UNAVAILABLE response |
| Self-join on 33M rows (too slow) | Intercepted before execution; warning card with faster alternatives shown |
| Ambiguous question (multiple valid interpretations) | LLM picks one interpretation; no clarification step |

### Dataset Limitations

- **No financial data** — price, revenue, cost, sales amount do not exist in any of the 6 CSV files. Questions about revenue cannot be answered.
- **No absolute timestamps** — `days_since_prior_order` is a relative measure (days between orders), not a calendar date. "Orders in January" cannot be answered.
- **`reordered` is product-scoped, not order-scoped** — `reordered=1` means this specific user bought this specific product before. It does not mean "this order is a repeat visit to the platform". Customer retention questions must use `order_number`, not `reordered`.
- **Test set has no product data** — `eval_set='test'` orders exist in `orders.csv` but have no corresponding rows in any order_products file. Queries that join test orders with products return no rows.

### Performance Limits

- **Self-join queries** (product co-occurrence): 2–5 minutes. Intercepted with a warning.
- **Groq rate limit**: 6,000 tokens/minute. Unlikely to hit during normal demo use.
- **Startup time**: 15–30 seconds to load 33M rows into DuckDB TABLEs.
- **localStorage**: Chat history is capped at 20 sessions (~5MB). Oldest sessions are removed when the limit is reached.

### LLM Limitations

- **No conversational memory**: Each question is independent. The LLM does not know what was asked before. Follow-up questions like "show that by department" require the full context to be included in the new question.
- **Complex subqueries**: Multi-step reasoning (e.g., "users who ordered X and also ordered Y") sometimes generates SQL with correlated subqueries that DuckDB cannot optimise. The retry catches syntax errors but not logical errors.
- **Rare terminology**: Questions using very domain-specific terms not in the glossary may generate wrong SQL on the first attempt. The retry usually corrects it.

---

## Project Structure

```
.
├── README.md
├── data/                          # CSV files (not committed — download separately)
│   ├── orders.csv
│   ├── order_products__prior.csv
│   ├── order_products__train.csv
│   ├── products.csv
│   ├── aisles.csv
│   └── departments.csv
│
├── backend/
│   ├── main.py                    # FastAPI app, CORS, lifespan (DB loaded once)
│   ├── pyproject.toml
│   ├── requirements.txt           # Pinned runtime dependencies
│   ├── .env.example
│   ├── prompts/
│   │   └── sql_system_prompt.txt  # LLM prompt with schema, rules, examples
│   ├── app/
│   │   ├── routes/
│   │   │   └── query.py           # POST /api/query endpoint
│   │   └── core/
│   │       ├── db.py              # DuckDB TABLE loading + indexes
│   │       ├── llm.py             # Groq + Ollama client with fallback
│   │       ├── sql_generator.py   # NL → SQL + hallucination detection
│   │       ├── sql_validator.py   # Alias validation + slow query detection
│   │       ├── query_runner.py    # SQL execution + retry logic
│   │       ├── chart_selector.py  # Heuristic chart type selection
│   │       ├── chart_builder.py   # Plotly figure construction
│   │       ├── summarizer.py      # Plain-English summary generation
│   │       └── exceptions.py      # Custom exception classes
│   └── tests/
│       ├── conftest.py
│       ├── test_db.py
│       ├── test_sql_generator.py
│       ├── test_query_runner.py
│       ├── test_chart_selector.py
│       └── test_llm.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── types/
│   │   │   ├── index.ts           # QueryRequest, QueryResponse, ChatMessage
│   │   │   └── session.ts         # Session (localStorage history)
│   │   ├── api/
│   │   │   └── query.ts           # API client
│   │   ├── hooks/
│   │   │   ├── useChat.ts         # Chat state + forceExecute
│   │   │   └── useSessions.ts     # localStorage session management
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ChatInput.tsx
│   │       ├── ChatMessage.tsx
│   │       ├── ResultCard.tsx
│   │       ├── ChartRenderer.tsx
│   │       ├── SqlViewer.tsx
│   │       ├── SlowQueryWarning.tsx
│   │       ├── UnavailableCard.tsx
│   │       ├── ErrorCard.tsx
│   │       ├── EmptyState.tsx
│   │       ├── QueryHistoryPanel.tsx
│   │       ├── SessionCard.tsx
│   │       └── Footer.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── docs/
    ├── dataset.md                 # Full dataset schema + query gotchas
    ├── sample_questions.md        # 28+ test questions, follow-up chains, edge cases
    └── tools_and_techniques.md    # Every tool + 15 performance techniques explained
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Backend framework | FastAPI + Uvicorn |
| Query engine | DuckDB (in-process OLAP) |
| LLM — primary | Groq API (Llama 3.3 70B, free tier) |
| LLM — fallback | Ollama (SQLCoder 7B, local M1 GPU) |
| Charts | Plotly (Python) → react-plotly.js |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Package management | uv (Python) + pnpm (JavaScript) |
| Session storage | Browser localStorage |
