#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Envio Dia 1 - Campanha 26 E-mails - Contatos 201 até o último (223 total)
Rate: 0.5s entre envios
Endpoint: Supabase send-campaign-now (sem CCO)
Subject: 1o item cronograma.json + " — Meta Construtor"
"""
import csv
import json
import time
import os
import sys
import urllib.request
import urllib.error

BASE = "C:/Users/nicol/OneDrive/Documentos/META CONSTRUTOR"
CSV = BASE + "/PROSPECCAO/contatos_master.csv"
PROJ = BASE + "/META CONSTRUTOR - APP/META_CONSTRUTOR-APP_REV - 2026"
TMPL = PROJ + "/campanha-26-dias/dia-01-rdo-tecnico.html"
CRONO = PROJ + "/campanha-26-dias/cronograma.json"
REL = PROJ + "/relatorio_dia1_batch_201_fim.txt"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"

# 1. Subject do Dia 1
# Se cronograma.json existir, usa o primeiro item. Senao, usa o subject hardcoded do run.py
if os.path.exists(CRONO):
    with open(CRONO, encoding="utf-8") as f:
        subject = json.load(f)[0]["subject"] + " — Meta Construtor"
else:
    subject = "RDO digital, sem print no WhatsApp — Meta Construtor"
print("Subject: " + subject)

# 2. Template HTML
with open(TMPL, encoding="utf-8") as f:
    tmpl = f.read()

# 3. Carregar todos contatos com email, do indice 200 em diante
all_contacts = []
with open(CSV, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        e = (row.get("email") or "").strip()
        n = (row.get("nome") or "").strip()
        if e and "@" in e:
            all_contacts.append({"to": e, "nome_empresa": n})

print(f"Total de contatos com email na base: {len(all_contacts)}")

# Indices: 200 ate o final (0-indexed)
contacts = all_contacts[200:]
print(f"Contatos do indice 200 ao final: {len(contacts)}")

# 4. Enviar
ok = 0
fail = 0
out = []
total = len(contacts)

for i, c in enumerate(contacts):
    html = tmpl.replace("{{CONTACT_ID}}", c["to"])
    payload = json.dumps({
        "subject": subject,
        "html": html,
        "emails": [{"to": c["to"], "nome_empresa": c["nome_empresa"]}]
    }).encode("utf-8")
    
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", errors="replace")
            if r.status == 200:
                ok += 1
                out.append(f"  [{i+1}/{total}] OK - {c['nome_empresa'] or '(sem nome)'} <{c['to']}>")
                print(f"[{i+1}/{total}] OK -> {c['to']}")
            else:
                fail += 1
                out.append(f"  [{i+1}/{total}] FAIL HTTP {r.status} - {c['to']}: {body[:200]}")
                print(f"[{i+1}/{total}] FAIL HTTP {r.status} -> {c['to']}: {body[:200]}")
    except urllib.error.HTTPError as e:
        fail += 1
        body = e.read().decode("utf-8", errors="replace")
        out.append(f"  [{i+1}/{total}] HTTP ERROR {e.code} - {c['to']}: {body[:200]}")
        print(f"[{i+1}/{total}] HTTP ERROR {e.code} -> {c['to']}: {body[:200]}")
    except Exception as e:
        fail += 1
        out.append(f"  [{i+1}/{total}] ERROR - {c['to']}: {str(e)[:200]}")
        print(f"[{i+1}/{total}] ERROR -> {c['to']}: {str(e)[:200]}")
    
    if i < total - 1:
        time.sleep(0.5)

# 5. Report
sep = "=" * 60
report_lines = []
report_lines.append("")
report_lines.append(sep)
report_lines.append("DIA 1 - CAMPANHA 26 E-MAILS - BATCH 201-FIM")
report_lines.append(sep)
report_lines.append(f"Subject: {subject}")
report_lines.append(f"Total contatos na base: {len(all_contacts)}")
report_lines.append(f"Indices: 200 a {len(all_contacts)-1}")
report_lines.append(f"Total enviados: {total}")
report_lines.append(f"Sucesso: {ok}")
report_lines.append(f"Falha: {fail}")
report_lines.append(sep)
report_lines.append("Detalhamento:")
report_lines.extend(out)
report_lines.append(sep)
report_lines.append("")

report = "\n".join(report_lines)

print("\n" + report)
with open(REL, "w", encoding="utf-8") as f:
    f.write(report)

print(f"\nRelatorio salvo em: {REL}")
sys.exit(0 if fail == 0 else 1)
