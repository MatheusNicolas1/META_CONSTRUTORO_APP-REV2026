#!/usr/bin/env python3
"""Faz deploy completo da Edge Function email-inbound-responder via Supabase API com PAT."""
import os, json, subprocess, sys

PROJECT_REF = "bgdvlhttyjeuprrfxgun"
REGION = "sa-south1"  # São Paulo

# Lê variáveis do .env
env_path = os.path.join(os.path.dirname(__file__) or ".", "..", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

SUPABASE_ACCESS_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN") or input("SUPABASE_ACCESS_TOKEN: ").strip()
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM = os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")

MGT_API = "https://api.supabase.com"
DB_API = f"https://{PROJECT_REF}.supabase.co"
FUNC_URL = f"https://{PROJECT_REF}.functions.supabase.co"

HEADERS = {
    "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
    "Content-Type": "application/json",
}

print(f"🔧 Deploy email-inbound-responder")
print(f"   Projeto: {PROJECT_REF}")
print(f"   Região: {REGION}")

# 1. Deploy da Edge Function via Management API
func_path = os.path.join(os.path.dirname(__file__) or ".", "..", "supabase", "functions", "email-inbound-responder", "index.ts")
with open(func_path, encoding="utf-8") as f:
    code = f.read()

# Cria/atualiza a função
import urllib.request
data = json.dumps({
    "slug": "email-inbound-responder",
    "name": "email-inbound-responder",
    "body": code,
    "verify_jwt": False,
    "region": REGION,
}).encode()

req = urllib.request.Request(
    f"{MGT_API}/v1/projects/{PROJECT_REF}/functions",
    data=data,
    headers=HEADERS,
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        print(f"✅ Function criada: {resp.status}")
        print(json.dumps(json.loads(resp.read()), indent=2))
except urllib.error.HTTPError as e:
    if e.code == 409:
        print("⚠️  Function já existe, atualizando...")
        # Busca o ID
        req2 = urllib.request.Request(f"{MGT_API}/v1/projects/{PROJECT_REF}/functions", headers=HEADERS)
        with urllib.request.urlopen(req2) as resp2:
            funcs = json.loads(resp2.read())
            existing = [f for f in funcs if f["slug"] == "email-inbound-responder"]
            if existing:
                fid = existing[0]["id"]
                data = json.dumps({"body": code}).encode()
                upd = urllib.request.Request(f"{MGT_API}/v1/projects/{PROJECT_REF}/functions/{fid}", data=data, headers=HEADERS, method="PATCH")
                try:
                    with urllib.request.urlopen(upd) as r:
                        print(f"✅ Function atualizada: {r.status}")
                except urllib.error.HTTPError as e2:
                    print(f"❌ Erro ao atualizar: {e2.code} {e2.read()}")
    else:
        print(f"❌ Erro: {e.code} {e.read()}")

# 2. Migration SQL via Service Role Key
print("\n🗄️  Executando migration SQL...")
mig_path = os.path.join(os.path.dirname(__file__) or ".", "..", "supabase", "migrations", "20260607_email_inbound_log.sql")
with open(mig_path, encoding="utf-8") as f:
    sql = f.read()

if SERVICE_ROLE_KEY:
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        f"{DB_API}/rest/v1/rpc/pg_query",
        data=data,
        headers={
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "apikey": SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ SQL executado: {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already exists" in body:
            print("✅ Tabela já existe (nada a fazer)")
        else:
            print(f"⚠️  SQL (pode ser erro de permissão): {e.code} {body[:200]}")
else:
    print("⚠️  SERVICE_ROLE_KEY não configurada, pular SQL migration")
    print("   Execute manualmente via SQL Editor no Supabase Dashboard")

# 3. Secrets
print("\n🔑 Configurando secrets...")
secrets_to_set = {
    "RESEND_API_KEY": RESEND_API_KEY,
}
for name, value in secrets_to_set.items():
    if value:
        data = json.dumps({"name": name, "value": value}).encode()
        req = urllib.request.Request(
            f"{MGT_API}/v1/projects/{PROJECT_REF}/secrets",
            data=data,
            headers=HEADERS,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"✅ Secret {name}: {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"⚠️  Secret {name}: {e.code}")

print("\n✅ Deploy concluído!")
print(f"\n📌 Webhook URL: {FUNC_URL}/email-inbound-responder")
print("\n📋 PRÓXIMOS PASSOS:")
print("   1. No Resend > Settings > Webhooks: adicionar URL acima (evento: email.received)")
print("   2. Configurar DNS do metaconstrutor.br.app no Resend")
print("   3. (Opcional) Adicionar OPENROUTER_API_KEY como secret para respostas com IA")
print("   4. (Opcional) Adicionar TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID para notificações")
print("   5. (Opcional) Adicionar RESEND_SIGNING_SECRET para verificar webhooks")
