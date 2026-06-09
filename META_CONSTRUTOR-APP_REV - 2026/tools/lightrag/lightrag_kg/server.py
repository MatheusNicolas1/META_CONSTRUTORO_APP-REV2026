"""MCP server for LightRAG — exposes safe read-only tools only.

NEVER expose kg-index, kg-to-obsidian, or rag index/export as MCP tools.
They could be called accidentally by Claude and waste tokens / API quota.

Available tools:
  kg_query     — semantic query over the codebase knowledge graph
  kg_insert_text — insert ad-hoc text (decisions, notes) into the graph
  kg_stats     — entity/relation/document counts
"""
from __future__ import annotations

import logging
from typing import Optional

from . import config
from .rag import get_rag

# MCP
try:
    from mcp.server import Server, NotificationOptions
    from mcp.server.models import InitializationOptions
    import mcp.server.stdio
    import mcp.types as types
except ImportError:
    Server = None
    types = None

logger = logging.getLogger(__name__)


async def serve():
    """Run MCP server over stdio."""
    if Server is None:
        raise ImportError("mcp package not installed. Run: uv sync --project tools/lightrag")

    rag = await get_rag()
    server = Server("lightrag")

    @server.list_tools()
    async def list_tools():
        return [
            types.Tool(
                name="kg_query",
                description="Semantic query over the project knowledge graph. Use for questions about code architecture, dependencies, patterns, decisions, and documentation.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The question or search term (natural language)",
                        },
                        "mode": {
                            "type": "string",
                            "enum": ["hybrid", "local", "global", "naive"],
                            "description": "Search mode: hybrid (default, best), local (entity neighborhood), global (community themes), naive (vector-only)",
                            "default": "hybrid",
                        },
                    },
                    "required": ["query"],
                },
            ),
            types.Tool(
                name="kg_insert_text",
                description="Insert ad-hoc text (decisions, notes, architecture choices) into the knowledge graph for future queries.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "The text content to insert",
                        },
                        "source": {
                            "type": "string",
                            "description": "Source label (e.g. 'chat-2026-06-08', 'decision-log')",
                        },
                    },
                    "required": ["text"],
                },
            ),
            types.Tool(
                name="kg_stats",
                description="Get entity, relation, and document counts from the knowledge graph.",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
        if name == "kg_query":
            query = arguments.get("query", "")
            mode = arguments.get("mode", "hybrid")
            result = await rag.query(query, mode=mode)
            return [types.TextContent(type="text", text=result)]

        elif name == "kg_insert_text":
            text = arguments.get("text", "")
            source = arguments.get("source", "mcp-insert")
            from .index import doc_id, slugify
            # Wrap text for insertion
            wrapped = f"NOTE: {source}\\n---\\n{text}"
            await rag.insert([wrapped], [doc_id(f"mcp-{source}")], [f"mcp/{source}"])
            return [types.TextContent(type="text", text=f"✓ Inserted {len(text)} chars from '{source}'")]

        elif name == "kg_stats":
            s = await rag.stats()
            return [types.TextContent(type="text", text=str(s))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="lightrag",
                server_version="0.1.0",
            ),
        )


def main():
    """Entry point for kg-server CLI command."""
    import asyncio
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(serve())


if __name__ == "__main__":
    main()
