#!/usr/bin/env python3
"""
Headroom Compression Utility — Meta Construtor
===============================================
Utilitário para comprimir contexto antes de enviar para APIs LLM.
Reduz tokens em 40-90% dependendo do tipo de dado.

Uso:
  from headroom_compress import smart_compress, print_stats

  # Comprime dados antes de enviar pro LLM
  compressed = smart_compress(dados_brutos, contexto="tool_output")
  # compressed agora tem os dados comprimidos

  # Ou se quiser comprimir mensagens completas
  from headroom_compress import compress_messages
  result = compress_messages(mensagens)
  print_stats(result)

Modos:
  - "text": dados textuais estruturados (relatórios, descrições)
  - "json": JSON grande (tool outputs, listas, resultados de busca)
  - "code": código fonte
  - "auto": detecta automaticamente
"""

import json
import logging
from typing import Any, Optional

logger = logging.getLogger("headroom_compress")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

HEADROOM_PROXY_URL = "http://127.0.0.1:8787"
COMPRESSION_THRESHOLD = 200  # chars mínimos pra tentar comprimir


# ---------------------------------------------------------------------------
# Comprime conteúdo text/JSON via proxy HTTP
# ---------------------------------------------------------------------------

def proxy_compress(
    messages: list[dict],
    model: str = "gpt-4o",
    proxy_url: str = HEADROOM_PROXY_URL,
) -> dict:
    """
    Envia mensagens pro Headroom proxy e retorna resultado comprimido.

    Args:
        messages: Lista de mensagens no formato OpenAI (role, content, tool_calls, etc.)
        model: Nome do modelo (usado pra tokenização)
        proxy_url: URL do proxy Headroom

    Returns:
        dict com chaves: messages, tokens_before, tokens_after, tokens_saved,
                         compression_ratio, transforms_applied, compressed
    """
    import urllib.request

    payload = json.dumps({
        "messages": messages,
        "model": model,
    }).encode()

    req = urllib.request.Request(
        f"{proxy_url}/v1/compress",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except Exception as e:
        logger.warning(f"Proxy compress failed: {e}")
        return {
            "messages": messages,
            "compressed": False,
            "error": str(e),
        }


# ---------------------------------------------------------------------------
# Comprime conteúdo direto (UniversalCompressor, modo Python puro)
# ---------------------------------------------------------------------------

def _get_compressor():
    """Retorna instância do UniversalCompressor (lazy import pra não quebrar sem headroom)."""
    try:
        from headroom.compression.universal import (
            UniversalCompressor,
            UniversalCompressorConfig,
        )
        config = UniversalCompressorConfig(
            use_magika=False,
            use_kompress=True,
            ccr_enabled=False,
            min_content_length=COMPRESSION_THRESHOLD,
            compression_ratio_target=0.3,
        )
        return UniversalCompressor(config=config)
    except ImportError:
        return None


def smart_compress(
    content: str,
    context: str = "auto",
) -> str:
    """
    Comprime conteúdo usando Headroom (UniversalCompressor).

    Args:
        content: Texto ou JSON para comprimir
        context: "text", "json", "code", ou "auto"

    Returns:
        Conteúdo comprimido (ou original se falhar)
    """
    if not content or len(content) < COMPRESSION_THRESHOLD:
        return content

    compressor = _get_compressor()
    if compressor is None:
        logger.warning("Headroom not installed. Returning original.")
        return content

    try:
        result = compressor.compress(content)
        if result and result.compressed and len(result.compressed) < len(content):
            saved = (1 - result.compression_ratio) * 100
            logger.info(
                f"Headroom: {len(content):,} -> {len(result.compressed):,} chars "
                f"({saved:.1f}% saved, type={result.content_type})"
            )
            return result.compressed
        return content
    except Exception as e:
        logger.warning(f"Headroom compress failed: {e}")
        return content


# ---------------------------------------------------------------------------
# Comprime mensagens completas (system + user + tool)
# ---------------------------------------------------------------------------

def compress_messages(
    messages: list[dict],
    model: str = "gpt-4o",
    use_proxy: bool = True,
) -> dict:
    """
    Comprime mensagens completas para API LLM.

    Tenta proxy primeiro; fallback pra compressão local.

    Args:
        messages: Lista de mensagens OpenAI-style
        model: Modelo alvo
        use_proxy: Se True, tenta proxy HTTP primeiro

    Returns:
        dict com resultado da compressão
    """
    if use_proxy:
        result = proxy_compress(messages, model=model)
        if result.get("compressed"):
            return result

    # Fallback: comprime cada mensagem individualmente
    compressed_msgs = []
    total_before = 0
    total_after = 0

    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, str) and len(content) > COMPRESSION_THRESHOLD:
            compressed = smart_compress(content)
            compressed_msgs.append({**msg, "content": compressed})
            total_before += len(content)
            total_after += len(compressed)
        else:
            compressed_msgs.append(msg)
            content_len = len(content) if isinstance(content, str) else len(json.dumps(content))
            total_before += content_len
            total_after += content_len

    ratio = total_after / total_before if total_before > 0 else 1.0
    return {
        "messages": compressed_msgs,
        "tokens_before": total_before,
        "tokens_after": total_after,
        "tokens_saved": total_before - total_after,
        "compression_ratio": ratio,
        "compressed": ratio < 1.0,
        "transforms_applied": ["local_universal"],
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def print_stats(result: dict) -> None:
    """Exibe estatísticas de compressão formatadas."""
    before = result.get("tokens_before", 0)
    after = result.get("tokens_after", 0)
    saved = result.get("tokens_saved", 0)
    ratio = result.get("compression_ratio", 1.0)
    transforms = result.get("transforms_applied", [])

    if before == 0:
        pct = 0
    else:
        pct = (1 - ratio) * 100

    print(f"  Tokens antes:     {before:>8,}")
    print(f"  Tokens depois:    {after:>8,}")
    print(f"  Tokens salvos:    {saved:>8,}")
    print(f"  Taxa compressão:  {pct:>5.1f}%")
    print(f"  Transforms:       {', '.join(transforms) if transforms else '(none)'}")
    print(f"  Comprimido:       {result.get('compressed', False)}")


def estimate_tokens(text: str) -> int:
    """Estimativa rápida de tokens (4 chars ~= 1 token)."""
    return len(text) // 4


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)

    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Teste rápido com dados simulados
        test_data = "\n".join([
            f"Obra {i}: Status={'andamento' if i%3==0 else 'planejamento'}, "
            f"Progresso={min(i*7, 100)}%, "
            f"Orcamento=R${50000+i*12000:,.2f}"
            for i in range(1, 101)
        ])
        print(f"Testando compressão com {len(test_data):,} chars...")
        compressed = smart_compress(test_data)
        print(f"Original:   {len(test_data):,} chars ({estimate_tokens(test_data):,} tokens)")
        print(f"Comprimido: {len(compressed):,} chars ({estimate_tokens(compressed):,} tokens)")
        print(f"Economia:   {(1 - len(compressed)/len(test_data))*100:.1f}%")
    else:
        print("headroom_compress.py — Utilitário de compressão de contexto")
        print()
        print("Uso como módulo:")
        print("  from headroom_compress import smart_compress, compress_messages")
        print()
        print("Uso como script:")
        print("  python headroom_compress.py --test")
