"""Export LightRAG knowledge graph to Obsidian-friendly Markdown.

Creates:
  docs/knowledge-graph/
    INDEX.md             — hub with stats and links
    entities/<name>.md   — per-entity notes with wikilinks
    sources/<path>.md    — per-source file notes
    communities/<id>.md  — Louvain community clusters
    .obsidian/app.json   — Graph View settings
"""
from __future__ import annotations

import argparse
import json
import logging
import shutil
from pathlib import Path

import networkx as nx
from networkx.algorithms.community import louvain_communities
from rich.console import Console
from rich.progress import Progress

from . import config
from .rag import get_rag

logger = logging.getLogger(__name__)
console = Console()


def _clean_graph_name(name: str) -> str:
    """Sanitize entity name for Obsidian filename."""
    import re
    name = re.sub(r'[<>:"/\\\\|?*]', "-", str(name))
    name = re.sub(r"\\s+", " ", name).strip()
    name = re.sub(r"\\.+$", "", name)
    return name[:200] if name else "unknown"


def _entity_type_color(entity_type: str) -> str:
    """Color for Graph View groups."""
    palette = {
        "class": "#ff6b6b",
        "function": "#4ecdc4",
        "variable": "#45b7d1",
        "module": "#96ceb4",
        "file": "#ffeaa7",
        "config": "#dfe6e9",
        "concept": "#a29bfe",
        "decision": "#fd79a8",
        "api": "#00cec9",
        "database": "#6c5ce7",
        "type": "#fdcb6e",
        "component": "#e17055",
    }
    return palette.get(entity_type.lower(), "#74b9ff")


def _make_wikilink(name: str, label: str | None = None) -> str:
    """Create Obsidian wikilink."""
    safe = _clean_graph_name(name)
    if label:
        return f"[[{safe}|{label}]]"
    return f"[[{safe}]]"


async def export(clean: bool = False):
    """Export knowledge graph to Obsidian vault."""
    rag = await get_rag()
    graph = rag.get_graph()

    vault = config.VAULT_PATH
    entities_dir = config.EXPORT_ENTITIES_DIR
    sources_dir = config.EXPORT_SOURCES_DIR
    communities_dir = config.EXPORT_COMMUNITIES_DIR
    obsidian_dir = vault / ".obsidian"

    if clean:
        console.print("[yellow]Cleaning previous export...[/yellow]")
        for d in [entities_dir, sources_dir, communities_dir]:
            if d.exists():
                shutil.rmtree(d)

    # Create dirs
    for d in [entities_dir, sources_dir, communities_dir, obsidian_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # Load data from storage
    try:
        from lightrag.storage import doc_status_storage, text_chunk_storage
        all_docs = doc_status_storage.get_all() or {}
        all_chunks = await text_chunk_storage.get_all() if hasattr(text_chunk_storage, 'get_all') else {}
    except Exception:
        all_docs = {}
        all_chunks = {}

    if graph is None or len(graph.nodes()) == 0:
        console.print("[yellow]Graph is empty. Nothing to export.[/yellow]")
        return

    console.print(f"[bold]Exporting graph:[/] {len(graph.nodes())} entities, {len(graph.edges())} relations")

    # --- Community detection ---
    console.print("[dim]Detecting communities (Louvain)...[/dim]")
    communities = list(louvain_communities(graph, seed=42))
    community_map: dict[str, int] = {}
    for cid, community in enumerate(communities):
        for node in community:
            community_map[str(node)] = cid

    # --- Export entities ---
    entity_count = 0
    with Progress(console=console) as progress:
        task = progress.add_task("[cyan]Exporting entities...", total=len(graph.nodes()))

        for node in graph.nodes():
            node_str = str(node)
            safe_name = _clean_graph_name(node_str)
            data = dict(graph.nodes[node])

            entity_type = data.get("entity_type", "concept")
            description = data.get("description", "")
            source_id = data.get("source_id", "")
            cid = community_map.get(node_str, -1)

            # Get neighbors
            neighbors = list(graph.neighbors(node))
            neighbor_links = []
            for nb in neighbors:
                edge_data = graph.get_edge_data(node, nb)
                rel_desc = ""
                if edge_data:
                    rel_desc = edge_data.get("description", "")
                safe_nb = _clean_graph_name(str(nb))
                if rel_desc:
                    neighbor_links.append(f"  - {_make_wikilink(str(nb))} — {rel_desc}")
                else:
                    neighbor_links.append(f"  - {_make_wikilink(str(nb))}")

            # Build note
            note = f"""---
entity_type: {entity_type}
community: {cid}
degree: {graph.degree(node)}
tags: [lightrag, entity]
---

# {safe_name}

**Type:** `{entity_type}`  

**Degree:** {graph.degree(node)}  

**Community:** #{cid}  

---

## Description

{description if description else "*No description available.*"}

---

## Connected Entities

{chr(10).join(neighbor_links) if neighbor_links else "*No connections.*"}

---

## Sources

{source_id.replace('<SEP>', chr(10)).strip() if source_id else "*No sources.*"}
"""
            (entities_dir / f"{safe_name}.md").write_text(note, encoding="utf-8")
            entity_count += 1
            progress.advance(task)

    # --- Export sources ---
    source_count = 0
    with Progress(console=console) as progress:
        task = progress.add_task("[cyan]Exporting sources...", total=0)  # indeterminate

        for doc_id_str, doc_info in all_docs.items():
            source_path = doc_info.get("file_path", doc_id_str) if isinstance(doc_info, dict) else doc_id_str
            # Clean the source path for filename
            safe_source = _clean_graph_name(str(source_path))
            status = doc_info.get("status", "unknown") if isinstance(doc_info, dict) else "unknown"

            note = f"""---
source_path: {source_path}
status: {status}
tags: [lightrag, source]
---

# Source: `{source_path}`

**Status:** {status}  

**Doc ID:** {doc_id_str}  

---

## Entities referring to this source

*Search for `{source_path}` in the knowledge graph.*
"""
            (sources_dir / f"{safe_source}.md").write_text(note, encoding="utf-8")
            source_count += 1

    # --- Export communities ---
    community_count = 0
    for cid, community in enumerate(communities):
        members = sorted([str(n) for n in community])
        member_links = "\\n".join(f"  - {_make_wikilink(m)}" for m in members)

        note = f"""---
community_id: {cid}
size: {len(members)}
tags: [lightrag, community]
---

# Community #{cid}

**Size:** {len(members)} entities  

---

## Members

{member_links}
"""
        (communities_dir / f"community_{cid:04d}.md").write_text(note, encoding="utf-8")
        community_count += 1

    # --- INDEX.md ---
    index_content = f"""---
tags: [lightrag, index]
---

# Knowledge Graph — Meta Construtor

**Provider:** {config.PROVIDER}  
**LLM:** {config.LLM_MODEL}  
**Embedding:** {config.EMBEDDING_MODEL}

---

## Stats

| Metric | Value |
|--------|-------|
| Entities | {entity_count} |
| Relations | {len(graph.edges())} |
| Communities | {community_count} |
| Sources | {source_count} |

---

## Communities

| # | Size | Link |
|---|------|------|
"""
    for cid, community in enumerate(communities):
        index_content += f"| {cid} | {len(community)} | {_make_wikilink(f'community_{cid:04d}')} |\\n"

    index_content += f"""
---

## Top Entities (by degree)

"""
    sorted_nodes = sorted(graph.nodes(), key=lambda n: graph.degree(n), reverse=True)[:20]
    for node in sorted_nodes:
        node_str = str(node)
        safe = _clean_graph_name(node_str)
        index_content += f"- {_make_wikilink(node_str)} (degree: {graph.degree(node)})\\n"

    index_content += """
---

*Generated by LightRAG kg-to-obsidian*
"""
    (vault / "INDEX.md").write_text(index_content, encoding="utf-8")

    # --- .obsidian/app.json (Graph View settings) ---
    obsidian_config = {
        "graphView": {
            "showTags": False,
            "showAttachments": False,
            "showOrphans": True,
            "showArrow": True,
            "nodeSize": 200,
            "lineSize": 1,
            "colorGroups": True,
            "collapseFilter": False,
        },
        "communityPluginSortOrder": "release",
        "communityPluginSearchResultsToggle": False,
        "communityThemeSearchResultsToggle": False,
        "vimMode": False,
        "promptDelete": False,
    }

    # Add community colors
    groups = []
    for cid, community in enumerate(communities):
        color = _entity_type_color(str(cid))
        groups.append({
            "query": f"path:entities/ AND tag:#{cid}",
            "color": color,
        })
    obsidian_config["communityColors"] = {str(cid): _entity_type_color(str(cid)) for cid in range(len(communities))}

    (obsidian_dir / "app.json").write_text(json.dumps(obsidian_config, indent=2), encoding="utf-8")

    console.print()
    console.print(f"[green]✓ Exportado: {entity_count} entidades[/green]")
    console.print(f"[green]✓ Exportado: {source_count} fontes[/green]")
    console.print(f"[green]✓ Exportado: {community_count} comunidades[/green]")
    console.print(f"[green]✓ Graph View configurado em:[/] {obsidian_dir / 'app.json'}")
    console.print(f"[green]✓ INDEX.md em:[/] {vault / 'INDEX.md'}")
    console.print()
    console.print(f"[bold]Para abrir no Obsidian:[/]")
    console.print(f"  obsidian://open?path={vault}")
    console.print()
    console.print(f"[bold]Ou manualmente:[/] File → Open folder as vault →")
    console.print(f"  {vault}")
    console.print()
    console.print("[bold]No Graph View:[/]")
    console.print("  1. Cmd+G (ou Ctrl+G) para abrir o Graph View")
    console.print("  2. Filter 'path:entities/' para ver só entidades")
    console.print("  3. Explore os wikilinks clicando nos nós")


def main():
    parser = argparse.ArgumentParser(description="Export LightRAG graph to Obsidian")
    parser.add_argument("--clean", action="store_true", help="Clean previous export before regenerating")
    args = parser.parse_args()

    import asyncio
    asyncio.run(export(clean=args.clean))


if __name__ == "__main__":
    main()
