#!/usr/bin/env python3
"""Daily index job: retry incremental index + export to Obsidian.
   Runs every 24h. Checks quota before starting — if exhausted, waits silently.
   If successful, exports Markdown to docs/knowledge-graph/."""

import asyncio, json, logging, pathlib, shutil, subprocess, sys, time
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("daily_index")

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
LIGHTRAG_DIR = PROJECT_ROOT / "tools" / "lightrag"
STORAGE_DIR = LIGHTRAG_DIR / "rag_storage"
VAULT_DIR = PROJECT_ROOT / "docs" / "knowledge-graph"
MANIFEST = LIGHTRAG_DIR / ".index_manifest.json"
DOC_STATUS = STORAGE_DIR / "kv_store_doc_status.json"


def _uv_run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["uv", "run", "--project", str(LIGHTRAG_DIR), *args],
        capture_output=True, text=True, timeout=600,
        cwd=str(PROJECT_ROOT),
    )


def _quota_exhausted(output: str) -> bool:
    """Check if failure is due to quota exhaustion (429)."""
    return "429" in output and "RESOURCE_EXHAUSTED" in output


def _count_pending_docs() -> int:
    """Count docs that still need processing."""
    if not DOC_STATUS.exists():
        return 0
    try:
        data = json.loads(DOC_STATUS.read_text(encoding="utf-8"))
        return sum(1 for v in data.values() if v.get("status") == "pending")
    except (json.JSONDecodeError, KeyError):
        return 0


def _docs_exist() -> bool:
    """Check if any docs have been uploaded to storage."""
    if not DOC_STATUS.exists():
        return False
    try:
        data = json.loads(DOC_STATUS.read_text(encoding="utf-8"))
        return len(data) > 0
    except (json.JSONDecodeError, KeyError):
        return False


async def run() -> int:
    log.info(f"=== Daily Index Run: {datetime.now().isoformat()} ===")

    # Phase 1: Quick quota probe — one LLM call to test
    log.info("Probing LLM quota...")
    probe = _uv_run("python", "-c", "from lightrag_kg.llm import call_llm; import asyncio; print(asyncio.run(call_llm('reply OK')))")

    if probe.returncode != 0 or _quota_exhausted(probe.stderr + probe.stdout):
        log.warning("⚠️  Quota exhausted. Skipping this cycle. Next attempt in 24h.")
        log.warning(f"   stderr: {probe.stderr.strip()[-300:]}")
        return 0  # Not a real error — just waiting

    log.info("✅ Quota available!")

    # Phase 2: Check how many docs we already have
    existing = _count_pending_docs()
    log.info(f"Pending docs: {existing}")

    # Phase 3: Incremental index (only new/modified files)
    log.info("Running incremental index...")
    result = _uv_run("kg-index")

    if result.returncode != 0:
        if _quota_exhausted(result.stderr + result.stdout):
            log.warning("⚠️  Quota exhausted during index. Partial progress saved.")
            return 0
        log.error(f"❌ Index failed: {result.stderr[-500:]}")
        return 1

    log.info("✅ Index complete!")

    # Phase 4: Get stats
    log.info("=== Post-index stats ===")
    stats = _uv_run("rag", "stats", "--json")
    if stats.returncode == 0:
        try:
            data = json.loads(stats.stdout.strip())
            log.info(f"   Entities: {data.get('entities', '?')}")
            log.info(f"   Relations: {data.get('relations', '?')}")
            log.info(f"   Model: {data.get('llm_model', '?')}")
        except json.JSONDecodeError:
            log.info(f"   {stats.stdout.strip()[:200]}")

    # Phase 5: Export to Obsidian
    log.info("Exporting to Obsidian Markdown...")
    export = _uv_run("kg-to-obsidian", "--clean")
    if export.returncode != 0:
        log.error(f"❌ Export failed: {export.stderr[-500:]}")
        return 1

    # Count exported files
    md_files = list(VAULT_DIR.rglob("*.md"))
    log.info(f"✅ Exported {len(md_files)} Markdown files to {VAULT_DIR}")

    # Phase 6: Check MCP
    mcp = _uv_run("rag", "mcp-check")
    if mcp.returncode == 0:
        log.info(f"✅ MCP check: {mcp.stdout.strip()[:200]}")

    log.info("=== Daily run complete ===")
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(run())
    sys.exit(exit_code)
