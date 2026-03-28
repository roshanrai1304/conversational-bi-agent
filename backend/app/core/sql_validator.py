"""
Method 2: Schema Column Validation

Detects semantic hallucinations by inspecting SELECT aliases for financial
concepts that have no columns in the Instacart dataset.

The Instacart dataset has NO financial data — no price, revenue, cost, or
sales columns exist anywhere in the 6 CSV files.
"""

import re
import logging
from typing import TypedDict

logger = logging.getLogger(__name__)


class SlowQueryWarning(TypedDict):
    message: str
    suggestions: list[str]


# Patterns that indicate a query will be slow on this dataset
_SLOW_PATTERNS: list[dict] = [
    {
        # Self-join: all_order_products joined with itself for co-occurrence analysis
        # 33M × 33M = billions of intermediate rows even with order_id filter
        'pattern': r'all_order_products\b.{0,300}JOIN\b.{0,300}all_order_products\b',
        'flags': re.IGNORECASE | re.DOTALL,
        'message': (
            'This query joins a 33M-row table with itself to find product co-occurrences. '
            'It may take 2–5 minutes on this dataset.'
        ),
        'suggestions': [
            'Which products are most often bought together with Organic Bananas?',
            'What are the top 10 products most frequently bought alongside whole milk?',
        ],
    },
    {
        # CROSS JOIN on large tables — always expensive
        'pattern': r'CROSS\s+JOIN\b',
        'flags': re.IGNORECASE,
        'message': (
            'This query uses a CROSS JOIN which multiplies every row by every other row. '
            'On a 33M-row table this will be extremely slow or run out of memory.'
        ),
        'suggestions': [
            'Which departments have the highest reorder rate?',
            'What are the top 10 most ordered products?',
        ],
    },
]


def detect_slow_query(sql: str) -> SlowQueryWarning | None:
    """
    Detect SQL patterns that will be slow on this dataset before executing them.
    Returns a warning dict with message + faster suggestions, or None if the query is fast.
    """
    for spec in _SLOW_PATTERNS:
        if re.search(spec['pattern'], sql, spec['flags']):
            logger.warning("Slow query pattern detected: %s", spec['pattern'][:60])
            return SlowQueryWarning(
                message=spec['message'],
                suggestions=spec['suggestions'],
            )
    return None

# Concepts with absolutely no representation in the Instacart dataset
UNAVAILABLE_CONCEPTS = frozenset({
    'revenue', 'price', 'cost', 'spend', 'profit',
    'margin', 'discount', 'sales', 'amount', 'value',
    'earning', 'income', 'payment', 'transaction', 'sale',
})


def detect_semantic_hallucination(sql: str) -> str | None:
    """
    Inspect SELECT aliases for financial concepts that don't exist in this dataset.

    Example caught:
        SELECT ROUND(AVG(op.add_to_cart_order * 1.0), 2) AS avg_revenue_per_order
        → alias 'avg_revenue_per_order' contains 'revenue' → hallucination detected

    Returns an error string (to be sent back to LLM as error_context) if a
    semantic hallucination is detected, None if the SQL looks clean.
    """
    aliases = re.findall(r'\bAS\s+([a-zA-Z_][a-zA-Z0-9_]*)', sql, re.IGNORECASE)

    for alias in aliases:
        words = set(re.split(r'[_]+', alias.lower()))
        matched = words & UNAVAILABLE_CONCEPTS

        if matched:
            concept = next(iter(matched))
            logger.warning(
                "Semantic hallucination detected — alias '%s' suggests '%s' data",
                alias, concept,
            )
            return (
                f"The alias '{alias}' suggests '{concept}' data which does NOT exist in this dataset. "
                f"This dataset has no financial columns — no price, revenue, cost, sales, or spend data. "
                f"Do not invent proxy calculations using unrelated columns like add_to_cart_order or reordered. "
                f"If you cannot answer the question with available data, use this exact format:\n"
                f"SELECT 'UNAVAILABLE: {concept} data does not exist in this dataset. "
                f"Available metrics include order counts, reorder rates, basket sizes, and order timing.' AS explanation"
            )

    return None
