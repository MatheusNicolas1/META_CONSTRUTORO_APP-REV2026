#!/usr/bin/env python3
"""
EXECUTOR FINAL DO DIA 1 - Contatos 151-200

Este script:
1. Lê contatos_master_atualizado.csv (índices 150-199)
2. Lê o template dia-01-rdo-tecnico.html
3. Envia 1 e-mail por vez via POST para a Supabase Edge Function
4. Rate: 0.5s entre envios
5. SEM CCO
6. Subject: "Acabe com o RDO perdido no WhatsApp — Meta Construtor"
7. Salva resultado completo em _send_output.txt
"""
import csv
import json
import time
import urllib.request
import urllib.error
import ssl
import os
import hashlib
import subprocess
import sys

# === CONFIG ===
BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
CSV_PATH = os.path.join(BASE, "contatos_master_atualizado.csv")
TEMPLATE_PATH = os.path.join(BASE, "campanha-26-dias", "dia-01-rdo-tecnico.html")
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp — Meta Construtor"
RATE_S = 0.5
OUTPUT_FILE = os.path.join(BASE, "_send_output.txt")
START_IDX = 150
END_IDX = 200  # exclusive

os.chdir(BASE)

log_lines = []

def log(msg):
    log_lines.append(msg)
    print(msg)

def save_log():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_lines))

# === READ TEMPLATE ===
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    html_template = f.read()

# === READ CSV ===
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# === BATCH ===
batch = rows[START_IDX:END_IDX]
log(f"Total rows in CSV: {len(rows)}")
log(f"Batch indices {START_IDX}-{END_IDX-1} (contatos {START_IDX+1}-{END_IDX}): {len(batch)} contatos")

# === BUILD EMAILS ===
emails = []
for i, r in enumerate(batch):
    nome = r.get("nome", "").strip()
    email = r.get("email", "").strip()
    site = r.get("site", "").strip()
    empresa = nome if nome and nome != "Empresa" else (site if site else "Empresa")
    if not email:
        log(f"  SKIP [{START_IDX+i}] {empresa}: sem email")
        continue
    emails.append({"to": email, "nome_empresa": empresa})
    log(f"  OK   [{START_IDX+i}] {empresa} <{email}>")

log(f"\nTotal a enviar: {len(emails)}")

if not emails:
    log("Nenhum email para enviar. Encerrando.")
    save_log()
    sys.exit(0)

# === SEND ===
results = {"success": 0, "fail": 0, "errors": []}
ctx = ssl.create_default_context()

for idx, entry in enumerate(emails):
    to = entry["to"]
    empresa = entry["nome_empresa"]

    contact_id = hashlib.md5(to.encode()).hexdigest()[:12]
    html_content = html_template.replace("{{CONTACT_ID}}", contact_id)

    payload = json.dumps({
        "subject": SUBJECT,
        "html": html_content,
        "emails": [entry]
    }).encode("utf-8")

    req = urllib.request.Request(
        URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        body = resp.read().decode("utf-8")
        results["success"] += 1
        log(f"  ✓ [{idx+1}/{len(emails)}] {empresa} <{to}> -> {resp.status} {body[:80]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        results["fail"] += 1
        results["errors"].append({"email": to, "status": e.code, "body": body})
        log(f"  ✗ [{idx+1}/{len(emails)}] {empresa} <{to}> -> HTTP {e.code}: {body}")
    except Exception as e:
        results["fail"] += 1
        results["errors"].append({"email": to, "error": str(e)})
        log(f"  ✗ [{idx+1}/{len(emails)}] {empresa} <{to}> -> {e}")

    time.sleep(RATE_S)

# === SUMMARY ===
log("")
log("=" * 60)
log("RESUMO DO ENVIO - Dia 1 - Contatos 151-200")
log("=" * 60)
log(f"Subject: {SUBJECT}")
log(f"Template: dia-01-rdo-tecnico.html")
log(f"Total na batch: {len(batch)}")
log(f"Com email: {len(emails)}")
log(f"Enviados com sucesso: {results['success']}")
log(f"Falhas: {results['fail']}")
if results['errors']:
    log("")
    log("Detalhes das falhas:")
    for e in results['errors']:
        log(f"  - {e.get('email','?')}: status={e.get('status','?')} body={e.get('body','')}")
log("")
log(f"Rate: {RATE_S}s entre envios")
log("CCO: NÃO")
log("FIM DO RELATORIO")

save_log()
print("\n✅ Log salvo em _send_output.txt")
