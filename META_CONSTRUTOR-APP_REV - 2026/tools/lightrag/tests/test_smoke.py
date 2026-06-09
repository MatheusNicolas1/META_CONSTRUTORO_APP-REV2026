"""Smoke tests for LightRAG knowledge graph package."""
import sys
import pytest


def test_imports():
    """All modules import cleanly."""
    from lightrag_kg import config
    assert config.PROVIDER in ("gemini", "openai", "anthropic", "ollama")

    from lightrag_kg import llm
    assert hasattr(llm, "call_llm")
    assert hasattr(llm, "call_embedding")

    from lightrag_kg import rag
    assert hasattr(rag, "get_rag")
    assert hasattr(rag, "query")

    from lightrag_kg import cli
    assert hasattr(cli, "main")

    from lightrag_kg import server
    assert hasattr(server, "main")


def test_config_paths():
    """Config paths resolve correctly."""
    from lightrag_kg import config
    assert config.PROJECT_ROOT.exists()
    assert config.VAULT_PATH.name == "knowledge-graph"
    assert config.STORAGE_PATH.name == "rag_storage"
