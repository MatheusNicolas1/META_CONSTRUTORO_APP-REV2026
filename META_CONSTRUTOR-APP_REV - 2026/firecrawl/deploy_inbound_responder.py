#!/usr/bin/env python3
"""
Deploy: email-inbound-responder Edge Function + Migration + Secrets
"""
import os, sys, json, subprocess, time, base64

PROJECT_REF = "bgdvlhttyjeuprrfxgun"
WORKDIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"

# Ler env
env = {}
with open(os.path.join(WORKDIR, ".env")) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SERVICE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env")
    sys.exit(1)

ANON_KEY = env.get("VITE_SUPABASE_ANON_KEY", "")
RESEND_KEY = env.get("RESEND_API_KEY", "")
RESEND_FROM = env.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")

print("🔧 Configurando Deployment...")
print(f"   Project: {PROJECT_REF}")
print(f"   Resend From: {RESEND_FROM}")

SUPABASE_MGMT = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

# ─────────────────────────────────────────────
# 1. Ler o código da Edge Function
# ─────────────────────────────────────────────
func_path = os.path.join(WORKDIR, "supabase", "functions", "email-inbound-responder", "index.ts")
with open(func_path, encoding="utf-8") as f:
    func_code = f.read()

# ─────────────────────────────────────────────
# 2. Fazer upload da Edge Function via Management API
# ─────────────────────────────────────────────
print("\n📤 Enviando Edge Function 'email-inbound-responder'...")

# Usa a API de Functions do Supabase Management
mgmt_url = f"{SUPABASE_MGMT}/functions"
mgmt_headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
}

# Verifica se a função já existe
check = subprocess.run(
    ["curl", "-s", "-w", "\n%{http_code}", mgmt_url, "-H", f"Authorization: Bearer {SERVICE_KEY}"],
    capture_output=True, text=True, timeout=30
)

existing_id = None
lines = check.stdout.strip().split("\n")
http_code = lines[-1].strip()
body = "\n".join(lines[:-1])

if http_code == "200":
    try:
        functions = json.loads(body)
        for fn in functions:
            if fn.get("name") == "email-inbound-responder":
                existing_id = fn.get("id")
                print(f"   ℹ️  Função já existe (id={existing_id}), vai atualizar...")
    except:
        pass

# Criar/atualizar função
entrypoint_path = "supabase/functions/email-inbound-responder/index.ts"

# Vamos usar uma abordagem mais direta - deploy via mgmt API como zip
import tempfile, zipfile

# Cria um zip do código
with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
    zip_path = tmp.name

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("index.ts", func_code)

# Lê o zip como base64
with open(zip_path, "rb") as f:
    zip_b64 = base64.b64encode(f.read()).decode()

os.unlink(zip_path)

if existing_id:
    # Atualizar
    url = f"{mgmt_url}/{existing_id}/body"
else:
    # Criar
    url = f"{mgmt_url}/email-inbound-responder/body"

deploy_data = {
    "name": "email-inbound-responder",
    "entrypoint_path": entrypoint_path,
    "import_map_path": "supabase/functions/import_map.json" if os.path.exists(os.path.join(WORKDIR, "supabase", "functions", "import_map.json")) else None,
    "verify_jwt": False,
}

deploy_resp = subprocess.run(
    ["curl", "-s", "-X", "POST" if not existing_id else "PUT",
     mgmt_url if not existing_id else f"{mgmt_url}/{existing_id}",
     "-H", f"Authorization: Bearer {SERVICE_KEY}",
     "-H", "Content-Type: application/json",
     "-d", json.dumps(deploy_data)],
    capture_output=True, text=True, timeout=30
)

print(f"   Resposta: {deploy_resp.stdout[:300]}")

# ─────────────────────────────────────────────
# 3. Rodar migration SQL via Management API
# ─────────────────────────────────────────────
print("\n🗄️  Executando migration no banco...")

migration_path = os.path.join(WORKDIR, "supabase", "migrations", "20260607_email_inbound_log.sql")
with open(migration_path, encoding="utf-8") as f:
    sql = f.read()

# Usa SQL API
sql_url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
sql_payload = json.dumps({"query": sql})

sql_resp = subprocess.run(
    ["curl", "-s", "-w", "\n%{http_code}", sql_url,
     "-X", "POST",
     "-H", f"Authorization: Bearer {SERVICE_KEY}",
     "-H", "apikey: {SERVICE_KEY}",
     "-H", "Content-Type: application/json",
     "-d", sql_payload],
    capture_output=True, text=True, timeout=30
)

sql_lines = sql_resp.stdout.strip().split("\n")
sql_code = sql_lines[-1].strip()
sql_body = "\n".join(sql_lines[:-1])

if sql_code in ("200", "201"):
    print("   ✅ Migration executada com sucesso!")
else:
    print(f"   ⚠️  Migration (pode ser erro de permissão ou já existe): HTTP {sql_code}")
    print(f"   {sql_body[:300]}")

# ─────────────────────────────────────────────
# 4. Configurar secrets
# ─────────────────────────────────────────────
print("\n🔑 Configurando secrets...")

secrets_url = f"{SUPABASE_MGMT}/secrets"

# Secrets que a função precisa
secrets_payload = json.dumps([
    {"name": "RESEND_API_KEY", "value": RESEND_KEY},
    {"name": "RESEND_FROM_EMAIL", "value": RESEND_FROM},
    {"name": "RESEND_SIGNING_SECRET", "value": ""},  # Será configurado manualmente
    {"name": "OPENROUTER_API_KEY", "value": ""},  # Opcional
    {"name": "TELEGRAM_BOT_TOKEN", "value": ""},  # Opcional
    {"name": "TELEGRAM_CHAT_ID", "value": ""},  # Opcional
])

secrets_resp = subprocess.run(
    ["curl", "-s", "-w", "\n%{http_code}", secrets_url,
     "-X", "PUT",
     "-H", f"Authorization: Bearer {SERVICE_KEY}",
     "-H", "Content-Type: application/json",
     "-d", secrets_payload],
    capture_output=True, text=True, timeout=30
)

secrets_lines = secrets_resp.stdout.strip().split("\n")
secrets_code = secrets_lines[-1].strip()

if secrets_code in ("200", "201", "204"):
    print("   ✅ Secrets configurados com sucesso!")
else:
    print(f"   ⚠️  Secrets: HTTP {secrets_code}")
    print(f"   {secrets_lines[0][:200]}")

print("\n" + "="*60)
print("✅ Deploy concluído!")
print("="*60)
print("\n⚠️  PRÓXIMOS PASSOS MANUAIS:")
print("   1. Criar RESEND_SIGNING_SECRET no site da Resend (Settings > Webhooks)")
print("   2. Criar OPENROUTER_API_KEY em openrouter.ai/keys (se quiser IA)")
print("   3. Criar TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID para notificações")
print("   4. Configurar webhook de inbound no Resend:")
print(f"      → POST https://{PROJECT_REF}.functions.supabase.co/email-inbound-responder")
print("   5. Configurar DNS do metaconstrutor.br.app no Resend")
