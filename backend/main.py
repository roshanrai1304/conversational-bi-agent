import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import get_schema_string, load_database
from app.routes.query import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — loading database...")
    app.state.con = load_database()
    app.state.schema = get_schema_string(app.state.con)
    logger.info("Database ready. Schema extracted.")
    yield
    app.state.con.close()
    logger.info("Database connection closed.")


app = FastAPI(
    title="BI Agent API",
    description="Conversational BI agent backed by DuckDB and Groq",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
