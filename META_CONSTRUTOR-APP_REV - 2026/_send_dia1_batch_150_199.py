#!/usr/bin/env python3
"""Send Dia 1 campaign to contacts 151-200 (indices 150-199)."""
import csv
import json
import time
import urllib.request
import urllib.error
import ssl
import os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

CSV_PATH = "contatos_master_atualizado.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp — Meta Construtor"
RATE_S = 0.5

# Read template
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    html_template = f.read()

# Read CSV
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Batch: indices 150-199 (0-based) -> contacts 151-200
batch = rows[150:200]
print(f"Total rows in CSV: {len(rows)}")
print(f"Batch size (indices 150-199): {len(batch)}")

# Build emails array
emails = []
for i, r in enumerate(batch):
    nome = r.get("nome", "").strip()
    email = r.get("email", "").strip()
    site = r.get("site", "").strip()
    empresa = nome if nome and nome != "Empresa" else (site if site else "Empresa")
    if not email:
        print(f"  SKIP [{150+i}] {empresa}: no email")
        continue
    emails.append({"to": email, "nome_empresa": empresa})
    print(f"  OK   [{150+i}] {empresa} <{email}>")

print(f"\nTotal emails to send: {len(emails)}")

if not emails:
    print("No emails to send. Exiting.")
    exit(0)

# Send one by one with 0.5s rate limit
results = {"success": 0, "fail": 0, "errors": []}
ctx = ssl.create_default_context()

for idx, entry in enumerate(emails):
    to = entry["to"]
    empresa = entry["nome_empresa"]

    # Build the HTML with contact_id = md5 hash of email (simple tracking)
    import hashlib
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
        headers={
            "Content-Type": "application/json",
            "Content-Length": str(len(payload))
        },
        method="POST"
    )

    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        body = resp.read().decode("utf-8")
        results["success"] += 1
        print(f"  ✓ [{idx+1}/{len(emails)}] {empresa} <{to}> -> {resp.status} {body[:80]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        results["fail"] += 1
        results["errors"].append({"email": to, "status": e.code, "body": body})
        print(f"  ✗ [{idx+1}/{len(emails)}] {empresa} <{to}> -> HTTP {e.code}: {body}")
    except Exception as e:
        results["fail"] += 1
        results["errors"].append({"email": to, "error": str(e)})
        print(f"  ✗ [{idx+1}/{len(emails)}] {empresa} <{to}> -> {e}")

    time.sleep(RATE_S)

# Summary
print(f"\n{'='*60}")
print(f"RESUMO DO ENVIO - Dia 1 - Contatos 151-200")
print(f"{'='*60}")
print(f"Subject: {SUBJECT}")
print(f"Template: dia-01-rdo-tecnico.html")
print(f"Total na batch: {len(batch)}")
print(f"Com email: {len(emails)}")
print(f"Enviados com sucesso: {results['success']}")
print(f"Falhas: {results['fail']}")
if results['errors']:
    print(f"\nDetalhes das falhas:")
    for e in results['errors']:
        print(f"  - {e.get('email','?')}: {e.get('status', e.get('error','?'))} {e.get('body','')}")
print(f"\nRate: {RATE_S}s entre envios")
print("CCO: NÃO")
