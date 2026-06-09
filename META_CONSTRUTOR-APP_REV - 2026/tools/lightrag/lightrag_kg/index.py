"""Index project files into LightRAG knowledge graph.

Usage:
    uv run --project tools/lightrag kg-index --dry-run   # preview only
    uv run --project tools/lightrag kg-index              # incremental
    uv run --project tools/lightrag kg-index --full       # rebuild from scratch
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import sys
import time
from pathlib import Path

from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn

from . import config
from .rag import get_rag

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
console = Console()

# ---------------------------------------------------------------------------
# Glob helpers
# ---------------------------------------------------------------------------

# Files to exclude always
EXCLUDE_DIRS = {
    "node_modules", ".next", "dist", "build", ".git", "target",
    "__pycache__", ".venv", "venv", "env", ".gitlab",
    "tests", "__tests__", "*-generated", "_generated",
    "coverage", ".vercel", ".cache",
    # Exclude lightrag itself
    "tools/lightrag",
    # Exclude vault output
    "docs/knowledge-graph",
}
EXCLUDE_EXTS = {
    ".lock", ".tsbuildinfo", ".map", ".min.js", ".min.css",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".webm", ".ogg", ".mp3", ".wav",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".pyc", ".pyo",
    ".pdf", ".psd", ".ai",
}

# Include patterns per stack (Next.js / Vite + React)
INCLUDE_GLOBS = [
    "*.md",
    "docs/**/*.md",
    "src/**/*.{ts,tsx,js,jsx}",
    "app/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "convex/**/*.ts",
    "prisma/**/*.prisma",
    "prisma/**/*.ts",
    "*.json",
    "*.toml",
    "*.yaml",
    "*.yml",
    "*.config.*",
    ".env.example",
    ".gitignore",
    "Dockerfile*",
    "*.sh",
    "*.bat",
    "*.ps1",
]


def slugify(text: str) -> str:
    """Robust slug: strips / first, then non-alnum chars."""
    text = text.strip().lower()
    text = re.sub(r"[/\\\\]", "-", text)
    text = re.sub(r"[^a-z0-9\\s_-]", "", text)
    text = re.sub(r"\\s+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-_")
    return (text[:180] if text else "unknown")


def doc_id(rel_path: str) -> str:
    """Deterministic doc ID from relative path."""
    h = hashlib.sha1(rel_path.encode()).hexdigest()[:12]
    return f"doc-{h}"


def content_hash(content: bytes) -> str:
    return hashlib.sha1(content).hexdigest()[:16]


def lang_from_ext(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".ts": "typescript",
        ".tsx": "typescriptreact",
        ".js": "javascript",
        ".jsx": "javascriptreact",
        ".py": "python",
        ".md": "markdown",
        ".json": "json",
        ".toml": "toml",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".prisma": "prisma",
        ".sh": "bash",
        ".bat": "batch",
        ".ps1": "powershell",
        ".css": "css",
        ".html": "html",
        ".env.example": "dotenv",
    }.get(ext, "text")


def collect_files(root: Path) -> list[Path]:
    """Collect all indexable files under root."""
    files = []
    root = root.resolve()
    for pattern in INCLUDE_GLOBS:
        # Use rglob for ** patterns
        if pattern.startswith("**"):
            for f in root.glob(pattern):
                files.append(f)
        elif "/" in pattern or "\\" in pattern:
            for f in root.glob(pattern):
                files.append(f)
        else:
            for f in root.rglob(pattern):
                files.append(f)

    # Deduplicate and filter
    seen = set()
    result = []
    for f in sorted(set(files)):
        if not f.is_file():
            continue
        # Check exclude dirs in path
        rel = f.relative_to(root).as_posix()
        parts = Path(rel).parts
        if any(p in EXCLUDE_DIRS for p in parts):
            continue
        if f.suffix.lower() in EXCLUDE_EXTS:
            continue
        if rel in seen:
            continue
        seen.add(rel)
        result.append(f)

    return result


def load_manifest(manifest_path: Path) -> dict[str, str]:
    if manifest_path.exists():
        try:
            return json.loads(manifest_path.read_text())
        except Exception:
            return {}
    return {}


def save_manifest(manifest_path: Path, manifest: dict[str, str]):
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True))


async def do_index(full: bool = False, dry_run: bool = False):
    """Main index routine."""
    root = config.PROJECT_ROOT
    manifest_path = config.LIGHTRAG_DIR / ".index_manifest.json"

    console.print(f"[bold]Root:[/] {root}")
    console.print(f"[bold]Provider:[/] {config.PROVIDER}")
    console.print(f"[bold]LLM:[/] {config.LLM_MODEL}")
    console.print(f"[bold]Embedding:[/] {config.EMBEDDING_MODEL}")
    console.print(f"[bold]Storage:[/] {config.STORAGE_PATH}")
    console.print()

    # Collect files
    all_files = collect_files(root)
    console.print(f"[bold]Found:[/] {len(all_files)} indexable files")
    console.print()

    if dry_run:
        console.print("[yellow]DRY RUN — no files will be indexed[/yellow]")
        console.print()
        console.print("[bold]Files to index:[/]")
        for f in all_files[:20]:
            rel = f.relative_to(root).as_posix()
            console.print(f"  • {rel}")
        if len(all_files) > 20:
            console.print(f"  ... and {len(all_files) - 20} more")
        console.print()
        console.print("[bold]Estimated cost:[/]")
        # Estimate: each file ~1 query for entities extraction
        # Gemini: 1500 req/day free tier
        total_chars = sum(f.stat().st_size for f in all_files)
        console.print(f"  Files: {len(all_files)}")
        console.print(f"  Total chars: {total_chars:,}")
        console.print(f"  Gemini free tier: 1,500 requests/day — enough for ~{1500 - len(all_files)} more files")
        console.print()
        console.print("[bold]Would index these paths:[/]")
        for excl in sorted(EXCLUDE_DIRS):
            console.print(f"  [dim]excluded:[/] {excl}")
        return

    # Load manifest for incremental
    manifest = load_manifest(manifest_path) if not full else {}
    new_files = []
    unchanged = 0

    for f in all_files:
        rel = f.relative_to(root).as_posix()
        try:
            data = f.read_bytes()
        except Exception:
            logger.warning("Cannot read %s, skipping", rel)
            continue
        ch = content_hash(data)
        if rel in manifest and manifest[rel] == ch:
            unchanged += 1
            continue
        new_files.append((rel, data, ch))

    if full:
        new_files = [(f.relative_to(root).as_posix(), f.read_bytes(), content_hash(f.read_bytes())) for f in all_files]
        unchanged = 0

    console.print(f"[bold]New/changed:[/] {len(new_files)} files")
    console.print(f"[bold]Unchanged:[/] {unchanged} files (skipped)")

    if not new_files:
        console.print("[green]✓ Nothing to index[/green]")
        return

    # Batch insert
    rag = await get_rag()

    # Prepare batches
    batch_size = 50
    total = len(new_files)
    inserted = 0
    failed = 0

    console.print()
    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Indexando...", total=total)

        for i in range(0, total, batch_size):
            batch = new_files[i : i + batch_size]
            texts = []
            ids = []
            file_paths = []

            for rel, data, _ in batch:
                content = data.decode("utf-8", errors="replace")
                lang = lang_from_ext(Path(rel))
                wrapped = f"FILE: {rel}\\nLANG: {lang}\\n---\\n{content}"
                texts.append(wrapped)
                ids.append(doc_id(rel))
                file_paths.append(rel)

            try:
                await rag.insert(texts, ids, file_paths)
                inserted += len(batch)
                # Update manifest for this batch
                for rel, _, ch in batch:
                    manifest[rel] = ch
                save_manifest(manifest_path, manifest)
            except Exception as e:
                logger.error("Batch insert failed at %d/%d: %s", i, total, e)
                failed += len(batch)
                # Try individually (slow path)
                for rel, data, ch in batch:
                    try:
                        content = data.decode("utf-8", errors="replace")
                        lang = lang_from_ext(Path(rel))
                        wrapped = f"FILE: {rel}\\nLANG: {lang}\\n---\\n{content}"
                        await rag.insert([wrapped], [doc_id(rel)], [rel])
                        inserted += 1
                        manifest[rel] = ch
                        save_manifest(manifest_path, manifest)
                    except Exception as e2:
                        logger.error("  Failed to index %s: %s", rel, e2)
                        failed += 1

            progress.advance(task, len(batch))

    console.print()
    console.print(f"[green]✓ Indexado: {inserted} arquivos[/green]")
    if failed:
        console.print(f"[red]✗ Falhas: {failed} arquivos[/red]")
    console.print(f"[bold]Total no grafo:[/] {manifest_path.stat().st_size if manifest_path.exists() else 0} bytes manifest")

    # Show stats
    s = await rag.stats()
    console.print()
    console.print("[bold]Stats after index:[/]")
    for k, v in s.items():
        console.print(f"  {k}: {v}")


def main():
    parser = argparse.ArgumentParser(description="LightRAG indexer")
    parser.add_argument("--dry-run", action="store_true", help="Preview files to index without running")
    parser.add_argument("--full", action="store_true", help="Rebuild from scratch")
    args = parser.parse_args()

    import asyncio
    asyncio.run(do_index(full=args.full, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
