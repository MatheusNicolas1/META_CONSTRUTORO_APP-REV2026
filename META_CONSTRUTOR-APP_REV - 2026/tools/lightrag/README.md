# LightRAG Knowledge Graph

Knowledge graph indexer + MCP server + Obsidian exporter for the Meta Construtor codebase.

## Quick start

```bash
# Index codebase (incremental)
uv run --project tools/lightrag kg-index

# Full rebuild
uv run --project tools/lightrag kg-index --full

# Preview
uv run --project tools/lightrag kg-index --dry-run

# Query via CLI
uv run --project tools/lightrag rag search "como funciona o sistema de obras"

# Export to Obsidian
uv run --project tools/lightrag kg-to-obsidian --clean

# Or use the unified CLI (activate venv first)
source tools/lightrag/.venv/bin/activate
rag search "termo"
rag stats
rag shell
```

## MCP (Claude Code)

Configured in `.mcp.json` at project root. Claude Code can use `kg_query`, `kg_insert_text`, and `kg_stats`.

## Structure

```
tools/lightrag/
├── pyproject.toml          # Package config with CLI entries
├── lightrag_kg/
│   ├── config.py           # Env-based configuration
│   ├── llm.py              # Provider wrappers (Gemini/OpenAI/Anthropic/Ollama)
│   ├── rag.py              # LightRAG singleton wrapper
│   ├── index.py            # File indexing with manifest
│   ├── server.py           # MCP stdio server (kg_query, kg_insert_text, kg_stats)
│   ├── to_obsidian.py      # Export to Obsidian vault
│   └── cli.py              # Unified `rag` CLI
└── tests/
    └── test_smoke.py
```
