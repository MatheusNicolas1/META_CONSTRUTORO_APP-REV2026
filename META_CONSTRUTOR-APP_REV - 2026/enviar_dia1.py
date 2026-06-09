#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ENVIO AUTOMATICO - DIA 1 DA CAMPANHA DE 26 E-MAILS

Para executar:
  python "CAMINHO_COMPLETO\\enviar_dia1.py"

ou clique duas vezes em enviar_dia1.bat
"""
import csv
import json
import time
import os
import sys
import urllib.request
import urllib.error

# Usando forward slashes para evitar escapes no Windows
BASE = "C:/Users/nicol/OneDrive/Documentos/META CONSTRUTOR"
CSV = BASE + "/PROSPECCAO/contatos_master.csv"
PROJ = BASE + "/META CONSTRUTOR - APP/META_CONSTRUTOR-APP_REV - 2026"
TMPL = PROJ + "/campanha-26-dias/dia-01-rdo-tecnico.html"
CRONO = PROJ + "/campanha-26-dias/cronograma.json"
REL = PROJ + "/relatorio_dia1.txt"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"

# 1. Subject do Dia 1
with open(CRONO, encoding="utf-8") as f:
    subject = json.load(f)[0]["subject"] + " --- Meta Construtor"
print("Subject: " + subject)

# 2. Template HTML
with open(TMPL, encoding="utf-8") as f:
    tmpl = f.read()

# 3. Primeiros 50 contatos com email valido
contacts = []
with open(CSV, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        e = (row.get("email") or "").strip()
        n = (row.get("nome") or "").strip()
        if e and "@" in e:
            contacts.append({"to": e, "nome_empresa": n})
            if len(contacts) >= 50:
                break

print("Contatos: " + str(len(contacts)))

# 4. Enviar
ok = 0
fail = 0
out = []
for i, c in enumerate(contacts):
    html = tmpl.replace("{{nome_empresa}}", c["nome_empresa"])
    payload = json.dumps({"subject": subject, "html": html, "emails": [c]}).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            if r.status == 200:
                ok += 1
                out.append("  [" + str(i+1) + "/50] OK - " + c["nome_empresa"] + " <" + c["to"] + ">")
            else:
                fail += 1
                body = r.read().decode("utf-8", errors="replace")
                out.append("  [" + str(i+1) + "/50] FAIL HTTP " + str(r.status) + " - " + c["nome_empresa"] + " <" + c["to"] + ">: " + body[:200])
    except urllib.error.HTTPError as e:
        fail += 1
        body = e.read().decode("utf-8", errors="replace")
        out.append("  [" + str(i+1) + "/50] HTTP ERROR " + str(e.code) + " - " + c["nome_empresa"] + " <" + c["to"] + ">: " + body[:200])
    except Exception as e:
        fail += 1
        out.append("  [" + str(i+1) + "/50] ERROR - " + c["nome_empresa"] + " <" + c["to"] + ">: " + str(e)[:200])
    if i < len(contacts) - 1:
        time.sleep(0.5)

# 5. Report
sep = "=" * 60
report_lines = []
report_lines.append("")
report_lines.append(sep)
report_lines.append("DIA 1 - CAMPANHA 26 E-MAILS")
report_lines.append(sep)
report_lines.append("Subject: " + subject)
report_lines.append("Total contatos: " + str(len(contacts)))
report_lines.append("Sucesso: " + str(ok))
report_lines.append("Falha: " + str(fail))
report_lines.append(sep)
report_lines.append("Detalhamento:")
report_lines.extend(out)
report_lines.append(sep)
report_lines.append("")

report = "\n".join(report_lines)

print("\n" + report)
with open(REL, "w", encoding="utf-8") as f:
    f.write(report)

print("\nRelatorio salvo em: " + REL)
sys.exit(0 if fail == 0 else 1)
