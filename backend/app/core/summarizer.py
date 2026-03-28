import logging

from app.core.llm import call_llm

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM = """You are a data analyst explaining a query result to a business stakeholder. Given a business question, the SQL used, and sample results, write a clear explanation of 4-5 sentences covering:

1. What data sources and joins were used to answer the question (plain English, no SQL jargon)
2. What aggregation or calculation was performed
3. The key finding or top result with specific numbers from the data
4. Any notable pattern, trend, or comparison visible in the results
5. What this means for the business or what action could be taken (optional but preferred)

Rules:
- Start with "To answer this, I've..." or "I analysed..."
- Include actual values, percentages, and rankings from the results
- Keep each sentence clear and non-technical — no SQL terms like JOIN, GROUP BY, or WHERE
- Write in first-person as an analyst explaining to a manager
- Return ONLY the paragraph, no headings or bullet points"""


def generate_summary(
    question: str,
    sql: str,
    sample_rows: list[dict],
) -> str | None:
    """
    Generate a plain-English 4-5 sentence summary covering approach, key findings, and insight.
    Returns None on any failure — summary is optional, never blocks the response.
    """
    try:
        sample_text = _format_sample(sample_rows)
        prompt = (
            f"Question: {question}\n\n"
            f"SQL used:\n{sql}\n\n"
            f"Sample results:\n{sample_text}"
        )
        result = call_llm(prompt=prompt, system=SUMMARY_SYSTEM, max_tokens=300, temperature=0.3)
        summary = result.strip()
        if not summary:
            return None
        logger.debug("Summary generated: %s", summary[:80])
        return summary
    except Exception as e:
        logger.warning("Summary generation failed (non-critical): %s", str(e))
        return None


def _format_sample(rows: list[dict]) -> str:
    if not rows:
        return "(no rows)"
    sample = rows[:5]
    headers = " | ".join(str(k) for k in sample[0].keys())
    lines = [headers, "-" * len(headers)]
    for row in sample:
        lines.append(" | ".join(str(v) for v in row.values()))
    return "\n".join(lines)
