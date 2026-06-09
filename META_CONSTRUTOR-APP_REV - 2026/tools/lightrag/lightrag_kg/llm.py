"""Provider-specific LLM wrappers with retry and fallback."""
import logging
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from . import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------
if config.PROVIDER == "gemini":
    from google import genai
    from google.genai import types as gemini_types

    _client: Optional[genai.Client] = None

    def _get_client() -> genai.Client:
        global _client
        if _client is None:
            if not config.GOOGLE_API_KEY:
                raise ValueError(
                    "GOOGLE_API_KEY not set. Add it to .env.local or "
                    "set LIGHTRAG_PROVIDER to a different provider."
                )
            _client = genai.Client(api_key=config.GOOGLE_API_KEY)
        return _client

    # Model fallback chain
    LLM_FALLBACKS = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
    ]
    EMBED_FALLBACKS = [
        "gemini-embedding-001",
        "gemini-embedding-2",
        "gemini-embedding-2-preview",
    ]

    _llm_model: Optional[str] = None
    _embed_model: Optional[str] = None

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        retry=retry_if_exception_type(
            (ConnectionError, TimeoutError, Exception)
        ),
    )
    async def call_llm(prompt: str, system_prompt: Optional[str] = None) -> str:
        """Call Gemini LLM with fallback chain."""
        client = _get_client()
        global _llm_model
        models_to_try = (
            [_llm_model] if _llm_model else LLM_FALLBACKS
        )
        for model in models_to_try:
            try:
                contents = []
                if system_prompt:
                    contents.append(
                        gemini_types.Content(
                            role="user",
                            parts=[gemini_types.Part(text=system_prompt)],
                        )
                    )
                contents.append(
                    gemini_types.Content(
                        role="user",
                        parts=[gemini_types.Part(text=prompt)],
                    )
                )
                response = client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=gemini_types.GenerateContentConfig(
                        max_output_tokens=4096,
                        temperature=0.1,
                    ),
                )
                _llm_model = model  # cache successful model
                return response.text
            except Exception as e:
                status = getattr(e, "code", None) or getattr(e, "status_code", None)
                if status in (404, 403, 401):
                    logger.warning("Model %s failed (%s), trying next fallback", model, e)
                    continue
                raise
        raise RuntimeError("All LLM models failed in fallback chain")

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
        retry=retry_if_exception_type(
            (ConnectionError, TimeoutError, Exception)
        ),
    )
    async def call_embedding(texts: list[str]) -> list[list[float]]:
        """Call Gemini embedding with fallback chain."""
        client = _get_client()
        global _embed_model
        models_to_try = (
            [_embed_model] if _embed_model else EMBED_FALLBACKS
        )
        for model in models_to_try:
            try:
                result = client.models.embed_content(
                    model=model,
                    contents=texts,
                )
                _embed_model = model
                return [e.values for e in result.embeddings]
            except Exception as e:
                status = getattr(e, "code", None) or getattr(e, "status_code", None)
                if status in (404, 403, 401):
                    logger.warning("Embedding model %s failed (%s), trying next", model, e)
                    continue
                raise
        raise RuntimeError("All embedding models failed in fallback chain")

# ---------------------------------------------------------------------------
# OpenAI
# ---------------------------------------------------------------------------
elif config.PROVIDER == "openai":
    from openai import AsyncOpenAI

    _client: Optional[AsyncOpenAI] = None

    def _get_client() -> AsyncOpenAI:
        global _client
        if _client is None:
            if not config.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not set in .env.local")
            _client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        return _client

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
    )
    async def call_llm(prompt: str, system_prompt: Optional[str] = None) -> str:
        client = _get_client()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        resp = await client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=4096,
        )
        return resp.choices[0].message.content or ""

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
    )
    async def call_embedding(texts: list[str]) -> list[list[float]]:
        client = _get_client()
        resp = await client.embeddings.create(
            model=config.EMBEDDING_MODEL,
            input=texts,
        )
        return [e.embedding for e in resp.data]

# ---------------------------------------------------------------------------
# Anthropic + Voyage
# ---------------------------------------------------------------------------
elif config.PROVIDER == "anthropic":
    from anthropic import AsyncAnthropic
    import voyageai

    _client: Optional[AsyncAnthropic] = None
    _vo_client: Optional[voyageai.Client] = None

    def _get_client() -> AsyncAnthropic:
        global _client
        if _client is None:
            if not config.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY not set in .env.local")
            _client = AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
        return _client

    def _get_vo() -> voyageai.Client:
        global _vo_client
        if _vo_client is None:
            if not config.VOYAGE_API_KEY:
                raise ValueError("VOYAGE_API_KEY not set in .env.local")
            _vo_client = voyageai.Client(api_key=config.VOYAGE_API_KEY)
        return _vo_client

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
    )
    async def call_llm(prompt: str, system_prompt: Optional[str] = None) -> str:
        client = _get_client()
        resp = await client.messages.create(
            model=config.LLM_MODEL,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            temperature=0.1,
        )
        return resp.content[0].text

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_exponential(multiplier=1, min=1, max=30),
    )
    async def call_embedding(texts: list[str]) -> list[list[float]]:
        vo = _get_vo()
        resp = vo.embed(texts, model=config.EMBEDDING_MODEL)
        return resp.embeddings

# ---------------------------------------------------------------------------
# Ollama local
# ---------------------------------------------------------------------------
elif config.PROVIDER == "ollama":
    import ollama

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def call_llm(prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        resp = ollama.chat(model=config.LLM_MODEL, messages=messages)
        return resp["message"]["content"]

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def call_embedding(texts: list[str]) -> list[list[float]]:
        resp = ollama.embed(model=config.EMBEDDING_MODEL, input=texts)
        return resp["embeddings"]

else:
    raise ImportError(f"Unsupported provider: {config.PROVIDER}")
