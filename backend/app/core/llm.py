import logging
import os

import groq as groq_sdk
import requests
from dotenv import load_dotenv

from app.core.exceptions import LLMUnavailableError

load_dotenv()

logger = logging.getLogger(__name__)


def _call_groq(prompt: str, system: str, max_tokens: int = 500, temperature: float = 0) -> str:
    client = groq_sdk.Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def _call_ollama(prompt: str, system: str) -> str:
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": os.getenv("OLLAMA_MODEL", "defog/sqlcoder-7b-2"),
            "prompt": full_prompt,
            "stream": False,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["response"]


def call_llm(prompt: str, system: str = "", max_tokens: int = 500, temperature: float = 0) -> str:
    """
    Call the active LLM provider. Returns raw text response.
    Primary: Groq API. Fallback: Ollama local.
    Raises: LLMUnavailableError if both providers fail.
    """
    provider = os.getenv("LLM_PROVIDER", "groq").lower()

    if provider == "ollama":
        try:
            logger.debug("Sending prompt to Ollama (%d chars)", len(prompt))
            result = _call_ollama(prompt, system)
            logger.info("Ollama call succeeded")
            return result
        except Exception as e:
            raise LLMUnavailableError(f"Ollama unavailable: {e}") from e

    # Default: Groq with Ollama fallback
    try:
        logger.debug("Sending prompt to Groq (%d chars)", len(prompt))
        result = _call_groq(prompt, system, max_tokens=max_tokens, temperature=temperature)
        logger.info("Groq API call succeeded")
        return result
    except groq_sdk.APIConnectionError as e:
        logger.warning("Groq connection error: %s. Retrying once...", str(e))
        try:
            result = _call_groq(prompt, system, max_tokens=max_tokens, temperature=temperature)
            logger.info("Groq retry succeeded")
            return result
        except Exception as retry_err:
            logger.warning("Groq retry failed: %s. Falling back to Ollama.", str(retry_err))
    except groq_sdk.RateLimitError as e:
        logger.warning("Groq rate limit hit: %s. Falling back to Ollama.", str(e))
    except groq_sdk.APIStatusError as e:
        logger.error("Groq API status error %s: %s. Falling back to Ollama.", e.status_code, str(e))

    try:
        result = _call_ollama(prompt, system)
        logger.info("Ollama fallback succeeded")
        return result
    except Exception as e:
        raise LLMUnavailableError(
            f"Both Groq and Ollama are unavailable. Last error: {e}"
        ) from e
