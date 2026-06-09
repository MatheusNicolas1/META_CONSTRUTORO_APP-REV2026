#!/usr/bin/env python3
"""
Envia Dia 1 da Campanha de 26 E-mails - contatos 50-99
Subject: "Acabe com o RDO perdido no WhatsApp — Meta Construtor"
Template: dia-01-rdo-tecnico.html
Rate: 0.5s entre envios
SEM CCO
"""
import csv
import json
import time
import urllib.request
import urllib.error
import sys

CSV_PATH = "lista_prospeccao_construtoras.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"

# Read template
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    template_html = f.read()

# Read CSV and get contacts indices 50-99 (lines 52-101 in file, 1-indexed)
contacts = []
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i < 50:
            continue
        if i > 99:
            break
        email = (row.get("email") or "").strip()
        empresa = (row.get("empresa") or "").strip()
        if email and empresa:
            contacts.append({"to": email, "nome_empresa": empresa})

print(f"Total contacts with email (indices 50-99): {len(contacts)}")

if not contacts:
    print("ERROR: No contacts with email found in range 50-99!")
    sys.exit(1)

success = 0
failed = 0
errors = []

for idx, contact in enumerate(contacts):
    # Replace {{nome_empresa}} in template
    html = template_html.replace("{{nome_empresa}}", contact["nome_empresa"])
    
    payload = {
        "subject": SUBJECT,
        "html": html,
        "emails": [{
            "to": contact["to"],
            "nome_empresa": contact["nome_empresa"]
        }]
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            print(f"[{idx+1}/{len(contacts)}] OK -> {contact['to']} ({contact['nome_empresa'][:30]}...) | {resp.status}")
            success += 1
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[{idx+1}/{len(contacts)}] FAIL -> {contact['to']} | HTTP {e.code}: {body[:200]}")
        failed += 1
        errors.append({"to": contact["to"], "error": f"HTTP {e.code}", "detail": body[:200]})
    except Exception as e:
        print(f"[{idx+1}/{len(contacts)}] FAIL -> {contact['to']} | {str(e)[:200]}")
        failed += 1
        errors.append({"to": contact["to"], "error": str(e)[:200]})
    
    # 0.5s rate limit between sends
    if idx < len(contacts) - 1:
        time.sleep(0.5)

print("\n" + "=" * 60)
print(f"RESUMO: {success} enviados, {failed} falhas")
if errors:
    print("\nErros:")
    for e in errors:
        print(f"  - {e['to']}: {e['error']} | {e.get('detail','')}")
print("=" * 60)
