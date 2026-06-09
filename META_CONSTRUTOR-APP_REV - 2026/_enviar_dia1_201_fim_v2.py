#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Envio Dia 1 - Campanha 26 E-mails - Contatos 201 ate o ultimo
Rate: 0.5s entre envios
Endpoint: Supabase send-campaign-now (SEM CCO)
Subject: "RDO digital, sem print no WhatsApp --- Meta Construtor"
"""
import csv, json, time, urllib.request, urllib.error, ssl, os, hashlib

OUTPUT_LOG = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_201_fim_log.txt"

def log(msg):
    with open(OUTPUT_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

CSV_PATH = "contatos_master_atualizado.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "RDO digital, sem print no WhatsApp \u2014 Meta Construtor"
RATE_S = 0.5

# Clear log
with open(OUTPUT_LOG, "w", encoding="utf-8") as f:
    f.write("")

# Read template
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    html_template = f.read()

# Read CSV
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Batch: indices 200 ate o final (0-based)
batch = rows[200:]
log(f"Total rows in CSV: {len(rows)}")
log(f"Batch size (indices 200-{len(rows)-1}): {len(batch)}")

# Build emails array (validar email)
emails = []
for i, r in enumerate(batch):
    nome = r.get("nome", "").strip()
    email = r.get("email", "").strip()
    site = r.get("site", "").strip()
    empresa = nome if nome and nome != "Empresa" else (site if site else "Empresa")
    if not email or "@" not in email:
        log(f"  SKIP [{200+i}] {empresa}: no valid email ({email or 'vazio'})")
        continue
    emails.append({"to": email, "nome_empresa": empresa})
    log(f"  OK   [{200+i}] {empresa} <{email}>")

log(f"\nTotal emails to send: {len(emails)}")

if not emails:
    log("No emails to send. Exiting.")
    exit(0)

# Send one by one with 0.5s rate limit
results = {"success": 0, "fail": 0, "errors": []}
ctx = ssl.create_default_context()

for idx, entry in enumerate(emails):
    to = entry["to"]
    empresa = entry["nome_empresa"]

    # Tracking: contact_id = md5 hash of email (12 chars)
    contact_id = hashlib.md5(to.encode()).hexdigest()[:12]
    html_content = html_template.replace("{{CONTACT_ID}}", contact_id)

    payload = json.dumps({
        "subject": SUBJECT,
        "html": html_content,
        "emails": [entry]
        # SEM CCO
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
        log(f"  \u2713 [{idx+1}/{len(emails)}] {empresa} <{to}> -> {resp.status} {body[:80]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        results["fail"] += 1
        results["errors"].append({"email": to, "status": e.code, "body": body})
        log(f"  \u2717 [{idx+1}/{len(emails)}] {empresa} <{to}> -> HTTP {e.code}: {body}")
    except Exception as e:
        results["fail"] += 1
        results["errors"].append({"email": to, "error": str(e)})
        log(f"  \u2717 [{idx+1}/{len(emails)}] {empresa} <{to}> -> {e}")

    time.sleep(RATE_S)

# Summary
log(f"\n{'='*60}")
log(f"RESUMO DO ENVIO - Dia 1 - Contatos 201-{len(rows)}")
log(f"{'='*60}")
log(f"Subject: {SUBJECT}")
log(f"Template: dia-01-rdo-tecnico.html")
log(f"CCO: NAO")
log(f"Total na batch: {len(batch)}")
log(f"Com email valido: {len(emails)}")
log(f"Enviados com sucesso: {results['success']}")
log(f"Falhas: {results['fail']}")
if results['errors']:
    log(f"\nDetalhes das falhas:")
    for e in results['errors']:
        log(f"  - {e.get('email','?')}: {e.get('status', e.get('error','?'))} {e.get('body','')}")
log(f"\nRate: {RATE_S}s entre envios")
log(f"FIM DO RELATORIO")
