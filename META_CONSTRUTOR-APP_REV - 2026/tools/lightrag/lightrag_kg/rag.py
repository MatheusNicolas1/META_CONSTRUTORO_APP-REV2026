"""LightRAG wrapper singleton with production parallel settings."""
from __future__ import annotations

import logging
from typing import Optional

from lightrag import LightRAG as _LightRAG
from lightrag.base import QueryParam
from lightrag.utils import EmbeddingFunc

from . import config
from .llm import call_llm, call_embedding

logger = logging.getLogger(__name__)

_rag: Optional["LightRAGWrapper"] = None


async def _embed_func(texts: list[str]) -> list[list[float]]:
    return await call_embedding(texts)


def _wrap_llm_func():
    """Return a sync-compatible LLM function for LightRAG."""

    async def llm_func(prompt: str, system_prompt: Optional[str] = None, **kwargs) -> str:
        return await call_llm(prompt, system_prompt=system_prompt)

    return llm_func


class LightRAGWrapper:
    """Thin wrapper around LightRAG with production defaults."""

    def __init__(self):
        config.STORAGE_PATH.mkdir(parents=True, exist_ok=True)

        self._rag = _LightRAG(
            working_dir=str(config.STORAGE_PATH),
            llm_model_func=_wrap_llm_func(),
            embedding_func=EmbeddingFunc(
                embedding_dim=3072,
                max_token_size=8192,
                func=_embed_func,
            ),
            llm_model_max_async=config.LLM_MODEL_MAX_ASYNC,
            max_parallel_insert=config.MAX_PARALLEL_INSERT,
            embedding_batch_num=config.EMBEDDING_BATCH_NUM,
            chunk_token_size=config.CHUNK_TOKEN_SIZE,
            chunk_overlap_token_size=config.CHUNK_OVERLAP,
            log_level=logging.WARNING,
        )

    async def initialize(self):
        """Initialize storages (must be awaited)."""
        await self._rag.initialize_storages()
        logger.info(
            "LightRAG initialized: storage=%s, provider=%s, llm=%s, embed=%s",
            config.STORAGE_PATH,
            config.PROVIDER,
            config.LLM_MODEL,
            config.EMBEDDING_MODEL,
        )

    async def insert(self, texts: list[str], ids: list[str], file_paths: list[str]):
        """Batch insert texts with deterministic IDs."""
        await self._rag.ainsert(
            texts,
            ids=ids,
            file_paths=file_paths,
        )

    async def query(self, text: str, mode: str = "hybrid") -> str:
        """Query the knowledge graph.

        API v1.5+ uses QueryParam(mode=...).
        Modes: hybrid (mix), local, global, naive.
        """
        mode_map = {
            "hybrid": "mix",
            "local": "local",
            "global": "global",
            "naive": "naive",
        }
        param = QueryParam(mode=mode_map.get(mode, "mix"))
        return await self._rag.aquery(text, param=param)

    async def stats(self) -> dict:
        """Return entity/relation/document stats."""
        entities = 0
        relations = 0
        try:
            kg = self._rag.get_knowledge_graph(node_label="entity", max_depth=1, max_nodes=1)
            entities = len(kg.nodes) if kg else 0
            relations = len(kg.edges) if kg else 0
        except Exception:
            # Fallback: use internal graph if available
            if hasattr(self._rag, 'graph') and self._rag.graph:
                try:
                    entities = len(self._rag.graph.graph.nodes())
                    relations = len(self._rag.graph.graph.edges())
                except Exception:
                    pass

        docs = 0
        try:
            docs_data = self._rag.get_docs_by_status(None)
            if docs_data:
                docs = len(docs_data)
        except Exception:
            pass

        return {
            "entities": entities,
            "relations": relations,
            "docs": docs,
            "provider": config.PROVIDER,
            "llm_model": config.LLM_MODEL,
            "embedding_model": config.EMBEDDING_MODEL,
        }

    def get_graph(self):
        """Return the underlying networkx graph (nodes/edges)."""
        if hasattr(self._rag, 'graph') and self._rag.graph:
            try:
                return self._rag.graph.graph
            except Exception:
                pass
        return None

    @property
    def raw(self) -> _LightRAG:
        return self._rag


async def get_rag() -> LightRAGWrapper:
    """Get or create singleton LightRAG wrapper."""
    global _rag
    if _rag is None:
        _rag = LightRAGWrapper()
        await _rag.initialize()
    return _rag


async def query(text: str, mode: str = "hybrid") -> str:
    """Convenience: query singleton."""
    r = await get_rag()
    return await r.query(text, mode=mode)


async def stats() -> dict:
    """Convenience: stats singleton."""
    r = await get_rag()
    return await r.stats()
