"""Unified CLI `rag` — query, stats, explore, index, export.

Usage:
    rag search "como funciona X"
    rag ask "explique Y"           # alias for search
    rag local "entidade"           # local mode
    rag global "tema"              # global mode
    rag chunks "termo"             # naive mode
    rag stats                      # graph statistics
    rag top [N]                    # top entities by degree
    rag find "entidade"            # find entity by substring
    rag show "entidade"            # full entity details
    rag index [--full|--dry-run]   # index/update knowledge graph
    rag export [--clean]           # export to Obsidian
    rag insert "texto" [--source]  # ad-hoc insert
    rag shell                      # interactive REPL
    rag mcp-check                  # validate .mcp.json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.table import Table
from rich.prompt import Prompt

from . import config
from . import rag as rag_mod

console = Console()


async def cmd_search(args):
    """Hybrid/naive/local/global query."""
    mode = getattr(args, "mode", "hybrid")
    ans = await rag_mod.query(args.term, mode=mode)
    if args.json:
        print(json.dumps({"mode": mode, "answer": ans}, ensure_ascii=False))
    else:
        console.print(Markdown(ans))


async def cmd_stats(args):
    """Graph statistics."""
    info = await rag_mod.stats()
    if args.json:
        print(json.dumps(info, ensure_ascii=False, indent=2))
    else:
        t = Table(title="LightRAG — Knowledge Graph Stats")
        for k, v in info.items():
            t.add_row(str(k), str(v))
        console.print(t)


async def cmd_top(args):
    """Top entities by degree."""
    rag_wrapper = await rag_mod.get_rag()
    graph = rag_wrapper.get_graph()
    if not graph:
        console.print("[yellow]Graph is empty[/yellow]")
        return

    n = args.n or 20
    sorted_nodes = sorted(graph.nodes(), key=lambda n: graph.degree(n), reverse=True)[:n]

    if args.json:
        result = [
            {"name": str(node), "degree": graph.degree(node)}
            for node in sorted_nodes
        ]
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        t = Table(title=f"Top {len(sorted_nodes)} Entities by Degree")
        t.add_column("Entity", style="cyan")
        t.add_column("Degree", style="yellow")
        for node in sorted_nodes:
            t.add_row(str(node), str(graph.degree(node)))
        console.print(t)


async def cmd_find(args):
    """Find entity by substring."""
    rag_wrapper = await rag_mod.get_rag()
    graph = rag_wrapper.get_graph()
    if not graph:
        console.print("[yellow]Graph is empty[/yellow]")
        return

    query = args.term.lower()
    matches = [str(n) for n in graph.nodes() if query in str(n).lower()]

    if args.json:
        print(json.dumps({"query": args.term, "matches": matches}, ensure_ascii=False))
    else:
        if matches:
            console.print(f"[green]Found {len(matches)} matches for '{args.term}':[/green]")
            for m in sorted(matches):
                console.print(f"  • {m}")
        else:
            console.print(f"[yellow]No entities matching '{args.term}'[/yellow]")


async def cmd_show(args):
    """Show entity details + neighbors."""
    rag_wrapper = await rag_mod.get_rag()
    graph = rag_wrapper.get_graph()
    if not graph:
        console.print("[yellow]Graph is empty[/yellow]")
        return

    node_name = args.term
    # Try exact match first, then substring
    matched = None
    for n in graph.nodes():
        if str(n).lower() == node_name.lower():
            matched = n
            break
    if matched is None:
        for n in graph.nodes():
            if node_name.lower() in str(n).lower():
                matched = n
                break

    if matched is None:
        console.print(f"[red]Entity '{node_name}' not found in graph[/red]")
        return

    data = dict(graph.nodes[matched])
    neighbors = list(graph.neighbors(matched))

    if args.json:
        result = {
            "name": str(matched),
            "data": {k: str(v) for k, v in data.items()},
            "neighbors": [{"name": str(nb), "relation": str(graph.get_edge_data(matched, nb, {}).get("description", ""))} for nb in neighbors],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        console.print(f"[bold cyan]# {matched}[/bold cyan]")
        for k, v in data.items():
            if k == "description":
                console.print(f"\n[bold]{k}:[/bold]")
                console.print(f"  {Markdown(str(v)[:2000])}")
            else:
                console.print(f"[bold]{k}:[/bold] {str(v)[:200]}")
        console.print(f"\n[bold]Neighbors ({len(neighbors)}):[/bold]")
        for nb in neighbors:
            edge = graph.get_edge_data(matched, nb, {})
            rel = edge.get("description", "") if edge else ""
            r = f" — {rel[:100]}" if rel else ""
            console.print(f"  • {nb}{r}")


async def cmd_shell(args):
    """Interactive REPL."""
    console.print("[bold cyan]LightRAG Shell[/bold cyan]")
    console.print("Commands: /search <q>, /local <q>, /global <q>, /chunks <q>, /stats, /top, /find <e>, /show <e>, /exit")
    console.print("Default (no prefix): hybrid search")
    console.print()

    while True:
        try:
            line = Prompt.ask("[bold]>[/bold]")
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not line:
            continue

        line = line.strip()

        # Commands
        if line == "/exit" or line == "/quit":
            break
        elif line == "/stats":
            await cmd_stats(argparse.Namespace(json=False))
        elif line.startswith("/top"):
            parts = line.split()
            n = int(parts[1]) if len(parts) > 1 else 20
            await cmd_top(argparse.Namespace(n=n, json=False))
        elif line.startswith("/find"):
            term = line[len("/find"):].strip()
            if term:
                await cmd_find(argparse.Namespace(term=term, json=False))
        elif line.startswith("/show"):
            term = line[len("/show"):].strip()
            if term:
                await cmd_show(argparse.Namespace(term=term, json=False))
        elif line.startswith("/local"):
            term = line[len("/local"):].strip()
            if term:
                ans = await rag_mod.query(term, mode="local")
                console.print(Markdown(ans))
        elif line.startswith("/global"):
            term = line[len("/global"):].strip()
            if term:
                ans = await rag_mod.query(term, mode="global")
                console.print(Markdown(ans))
        elif line.startswith("/chunks"):
            term = line[len("/chunks"):].strip()
            if term:
                ans = await rag_mod.query(term, mode="naive")
                console.print(Markdown(ans))
        elif line.startswith("/"):
            console.print(f"[red]Unknown command: {line.split()[0]}[/red]")
        else:
            ans = await rag_mod.query(line, mode="hybrid")
            console.print(Markdown(ans))


async def cmd_index(args):
    """Delegate to kg-index."""
    from . import index as index_mod
    await index_mod.do_index(full=args.full, dry_run=args.dry_run)


async def cmd_export(args):
    """Delegate to kg-to-obsidian."""
    from . import to_obsidian as obsidian_mod
    await obsidian_mod.export(clean=args.clean)


async def cmd_insert(args):
    """Insert ad-hoc text into graph."""
    rag_wrapper = await rag_mod.get_rag()
    source = args.source or "cli-insert"
    from .index import doc_id
    text = args.text
    wrapped = f"NOTE: {source}\n---\n{text}"
    await rag_wrapper.insert([wrapped], [doc_id(f"cli-{source}")], [f"cli/{source}"])
    console.print(f"[green]✓ Inserted {len(text)} chars from '{source}'[/green]")


async def cmd_mcp_check(args):
    """Validate .mcp.json configuration."""
    mcp_path = config.PROJECT_ROOT / ".mcp.json"
    checks = []

    # 1. File exists
    if mcp_path.exists():
        checks.append(("✅ .mcp.json exists", True))
    else:
        checks.append(("❌ .mcp.json not found", False))
        console.print("\n".join(f"{s}" for s, ok in checks))
        return

    # 2. Has lightrag entry
    import json as _json
    data = _json.loads(mcp_path.read_text())
    servers = data.get("mcpServers", {})
    if "lightrag" in servers:
        checks.append(("✅ 'lightrag' entry in mcpServers", True))
        lr = servers["lightrag"]
        checks.append((f"   command: {lr.get('command', '?')}", True))
        args_list = lr.get("args", [])
        checks.append((f"   args: {' '.join(args_list)}", True))
    else:
        checks.append(("❌ No 'lightrag' entry in mcpServers", False))

    # 3. Path resolves
    if args_list and len(args_list) > 1 and args_list[0] == "--project":
        project_path = Path(args_list[1])
        exists = project_path.exists()
        checks.append((f"{'✅' if exists else '❌'} Project path: {args_list[1]}", exists))

    # 4. Can import server module
    try:
        import importlib
        importlib.import_module("lightrag_kg.server")
        checks.append(("✅ lightrag_kg.server importable", True))
    except Exception as e:
        checks.append((f"❌ Cannot import lightrag_kg.server: {e}", False))

    console.print("\n".join(f"{s}" for s, ok in checks))
    if all(ok for _, ok in checks):
        console.print("\n[green]✓ MCP check passed[/green]")
    else:
        console.print("\n[yellow]Fix the issues above, then re-run rag mcp-check[/yellow]")


def main():
    p = argparse.ArgumentParser(prog="rag", description="LightRAG knowledge graph CLI")
    p.add_argument("--json", action="store_true", help="Machine-readable JSON output")
    sub = p.add_subparsers(dest="cmd", required=True)

    # Query commands
    for name, mode in [("search", "hybrid"), ("ask", "hybrid"), ("chunks", "naive"), ("local", "local"), ("global", "global")]:
        sp = sub.add_parser(name, help=f"{mode} mode query")
        sp.add_argument("term", nargs="+")

    # Stats
    sub.add_parser("stats", help="Graph statistics")

    # Top
    sp = sub.add_parser("top", help="Top entities by degree")
    sp.add_argument("n", nargs="?", type=int, default=20)

    # Find
    sp = sub.add_parser("find", help="Find entities by substring")
    sp.add_argument("term", nargs="+")

    # Show
    sp = sub.add_parser("show", help="Show entity details + neighbors")
    sp.add_argument("term", nargs="+")

    # Shell
    sub.add_parser("shell", help="Interactive REPL")

    # Index
    sp = sub.add_parser("index", help="Index/update knowledge graph")
    sp.add_argument("--full", action="store_true", help="Rebuild from scratch")
    sp.add_argument("--dry-run", action="store_true", help="Preview only")

    # Export
    sp = sub.add_parser("export", help="Export to Obsidian vault")
    sp.add_argument("--clean", action="store_true", help="Clean before export")

    # Insert
    sp = sub.add_parser("insert", help="Insert ad-hoc text")
    sp.add_argument("text")
    sp.add_argument("--source", default=None, help="Source label")

    # MCP check
    sub.add_parser("mcp-check", help="Validate .mcp.json")

    args = p.parse_args()

    # Convert 'term' list to string
    if hasattr(args, "term") and args.term is not None:
        args.term = " ".join(args.term)

    # Dispatch
    dispatch = {
        "search": cmd_search,
        "ask": cmd_search,
        "chunks": cmd_search,
        "local": cmd_search,
        "global": cmd_search,
        "stats": cmd_stats,
        "top": cmd_top,
        "find": cmd_find,
        "show": cmd_show,
        "shell": cmd_shell,
        "index": cmd_index,
        "export": cmd_export,
        "insert": cmd_insert,
        "mcp-check": cmd_mcp_check,
    }

    fn = dispatch.get(args.cmd)
    if fn:
        asyncio.run(fn(args))
    else:
        p.print_help()


if __name__ == "__main__":
    main()
