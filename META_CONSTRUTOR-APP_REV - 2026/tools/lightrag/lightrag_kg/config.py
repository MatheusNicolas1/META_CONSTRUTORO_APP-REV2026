"""LightRAG configuration — reads .env.local from project root."""
import os
import pathlib
from dotenv import load_dotenv

# Find project root (where .env.local lives)
_HERE = pathlib.Path(__file__).resolve().parent  # lightrag_kg/
_TOOLS = _HERE.parent  # tools/lightrag/
_PROJECT = _TOOLS.parent.parent  # project root

# Load .env.local from project root
_env_file = _PROJECT / ".env.local"
if _env_file.exists():
    load_dotenv(_env_file, override=True)

# Also try .env
_env_file2 = _PROJECT / ".env"
if _env_file2.exists():
    load_dotenv(_env_file2, override=False)

# --- Provider ---
PROVIDER = os.environ.get("LIGHTRAG_PROVIDER", "gemini").lower()
assert PROVIDER in ("gemini", "openai", "anthropic", "ollama"), (
    f"Unknown provider: {PROVIDER}. Set LIGHTRAG_PROVIDER in .env.local"
)

# --- API Keys ---
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY", "")


def _default_llm() -> str:
    return {
        "gemini": "gemini-2.5-flash",
        "openai": "gpt-4o-mini",
        "anthropic": "claude-sonnet-4-20250514",
        "ollama": "qwen2.5-coder:7b",
    }.get(PROVIDER, "gemini-2.5-flash")


def _default_embedding() -> str:
    return {
        "gemini": "gemini-embedding-exp-03-07",
        "openai": "text-embedding-3-small",
        "anthropic": "voyage-3",
        "ollama": "nomic-embed-text",
    }.get(PROVIDER, "gemini-embedding-exp-03-07")


# --- Models ---
LLM_MODEL = os.environ.get("LIGHTRAG_LLM_MODEL", _default_llm())
EMBEDDING_MODEL = os.environ.get("LIGHTRAG_EMBEDDING_MODEL", _default_embedding())
LLM_MODEL_MAX_ASYNC = int(os.environ.get("LIGHTRAG_MAX_ASYNC", "8"))
MAX_PARALLEL_INSERT = int(os.environ.get("LIGHTRAG_PARALLEL_INSERT", "6"))

# --- Paths ---
PROJECT_ROOT = _PROJECT
LIGHTRAG_DIR = _TOOLS
VAULT_PATH = _PROJECT / "docs" / "knowledge-graph"
STORAGE_PATH = _TOOLS / "rag_storage"

# --- Chunking ---
CHUNK_TOKEN_SIZE = int(os.environ.get("LIGHTRAG_CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.environ.get("LIGHTRAG_CHUNK_OVERLAP", "100"))
EMBEDDING_BATCH_NUM = int(os.environ.get("LIGHTRAG_EMBED_BATCH", "32"))

# --- Obsidian export ---
EXPORT_ENTITIES_DIR = VAULT_PATH / "entities"
EXPORT_SOURCES_DIR = VAULT_PATH / "sources"
EXPORT_COMMUNITIES_DIR = VAULT_PATH / "communities"
