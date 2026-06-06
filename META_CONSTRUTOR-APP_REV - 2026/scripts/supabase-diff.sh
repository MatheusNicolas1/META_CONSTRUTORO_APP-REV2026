#!/usr/bin/env bash
# supabase-diff.sh — Verifica drift entre migrações locais e banco remoto do Supabase
# Uso: bash scripts/supabase-diff.sh
# Requer: npx, supabase CLI, linked project
# Nota: Docker Desktop é necessário para diff local; sem ele, faz apenas diff com db dump remoto

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=============================================="
echo " 🔍 Supabase Diff: Local vs Remoto"
echo "=============================================="
echo ""

# ── Configurações ─────────────────────────────────────────────────────
PROJECT_ID="bgdvlhttyjeuprrfxgun"
LINKED_FILE="supabase/.temp/linked-project.json"

# ── Utilitário: listar tabelas/views/funções do banco remoto ────────
list_remote_schema() {
  echo "  📋 Tabelas e views no remoto:"
  npx supabase db dump --schema public --data-only 2>/dev/null | \
    grep -oE '(CREATE TABLE|CREATE VIEW|CREATE OR REPLACE VIEW) [A-Za-z_]+' | \
    awk '{print $NF}' | sort -u | sed 's/^/    • /' || echo "    (não foi possível listar)"
  echo ""
  echo "  📋 Funções no remoto:"
  npx supabase db dump --schema public --data-only 2>/dev/null | \
    grep -oE 'CREATE OR REPLACE FUNCTION [A-Za-z_]+' | \
    awk '{print $NF}' | sort -u | sed 's/^/    • /' || echo "    (não foi possível listar)"
}

echo "[1/4] Verificando se supabase CLI está configurado..."
echo ""

# Verifica se o projeto está linked via arquivo e config
SKIP_DIFF=false
if [ ! -f "$LINKED_FILE" ]; then
  echo "  ⚠️  Projeto não linked (linked-project.json não encontrado)."
  echo "     Execute 'npx supabase link --project-ref $PROJECT_ID'"
  SKIP_DIFF=true
else
  echo "  ✅ Projeto linked: $PROJECT_ID"
fi

echo ""

# ── 2. Executa supabase db diff --linked ──────────────────────────────
echo "[2/4] Executando supabase db diff --linked..."
echo ""

DRIFT_FOUND=""
NEEDS_DOCKER=false
DIFF_OUTPUT=""

if [ "$SKIP_DIFF" = false ]; then
  set +e
  DIFF_OUTPUT=$(npx supabase db diff --linked 2>&1)
  DIFF_EXIT=$?
  set -e

  # Verifica se o erro é de Docker
  if echo "$DIFF_OUTPUT" | grep -qi "docker"; then
    echo "  ⚠️  Docker Desktop não disponível — pulando diff com shadow database."
    echo "     Use supabase-diff.bat (Windows) ou instale Docker Desktop."
    echo ""
    DRIFT_FOUND="unknown"
    NEEDS_DOCKER=true
  elif echo "$DIFF_OUTPUT" | grep -qiE "(no changes|nothing to change|No changes found|already up to date|synchronized|synced|No difference)"; then
    DRIFT_FOUND=false
  elif [ $DIFF_EXIT -eq 0 ] && [ -z "$(echo "$DIFF_OUTPUT" | grep -v '^\s*$')" ]; then
    # Saída vazia ou só whitespace = sem diferenças
    DRIFT_FOUND=false
  elif echo "$DIFF_OUTPUT" | grep -qiE "(Error|error|not found|not linked|unauthorized|Invalid)"; then
    echo "  ⚠️  Erro ao executar diff:"
    echo "$DIFF_OUTPUT"
    DRIFT_FOUND="unknown"
  else
    DRIFT_FOUND=true
  fi

  if [ "$DRIFT_FOUND" != "unknown" ]; then
    echo "$DIFF_OUTPUT"
  fi
  echo ""
fi

# ── 3. Lista migrações locais ──────────────────────────────────────────
echo "[3/4] Migrações locais:"
echo ""

LOCAL_MIGRATIONS=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "  📁 Total: $LOCAL_MIGRATIONS migrações"
echo "  📁 Últimas 5:"
ls -1t supabase/migrations/*.sql 2>/dev/null | head -5 | while read -r f; do
  echo "    📄 $(basename "$f")"
done
echo ""

# ── 4. Schema remoto ──────────────────────────────────────────────────
echo "[4/4] Schema remoto (tabelas principais):"
echo ""

list_remote_schema
echo ""

echo "=============================================="

# ── Diagnóstico final ────────────────────────────────────────────────
if [ "$DRIFT_FOUND" = "false" ]; then
  echo " ✅ Local e remoto sincronizados"
  echo "    Nenhuma diferença detectada entre migrações locais e banco remoto."
elif [ "$DRIFT_FOUND" = "true" ]; then
  echo " ⚠️  Drift detectado:"
  echo "    Foram encontradas diferenças entre o schema local e remoto:"
  echo ""
  while IFS= read -r line; do
    echo "    $line"
  done <<< "$DIFF_OUTPUT"
elif [ "$NEEDS_DOCKER" = true ]; then
  echo " ⚠️  Docker Desktop necessário para diff completo"
  echo "    Para usar diff completo, instale Docker Desktop e tente novamente."
  echo "    O dump do schema remoto foi listado acima como referência."
elif [ -n "$DRIFT_FOUND" ]; then
  echo " ⚠️  Estado desconhecido — verifique erros acima."
fi

echo "=============================================="
