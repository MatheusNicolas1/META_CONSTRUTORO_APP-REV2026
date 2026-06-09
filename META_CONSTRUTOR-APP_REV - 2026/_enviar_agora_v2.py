#!/usr/bin/env python3
"""
ENVIO DIA 1 - CONTATOS 151-200 (indices 150-199)
Executar com: python _enviar_agora_v2.py
"""
import csv, json, time, urllib.request, urllib.error, ssl, os, hashlib

BASE = "C:/Users/nicol/OneDrive/Documentos/META CONSTRUTOR/META CONSTRUTOR - APP/META_CONSTRUTOR-APP_REV - 2026"
os.chdir(BASE)

CSV_PATH = "contatos_master_atualizado.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"
RATE = 0.5

with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    html = f.read()

with open(CSV_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

batch = rows[150:200]
print(f"CSV total: {len(rows)} linhas")
print(f"Batch 151-200 (indices 150-199): {len(batch)} contatos\n")

emails = []
for i, r in enumerate(batch):
    nome = r.get("nome","").strip()
    email = r.get("email","").strip()
    site = r.get("site","").strip()
    empresa = nome if nome and nome != "Empresa" else (site if site else "Empresa")
    if not email:
        print(f"  SKIP [{150+i}] {empresa}: sem email")
        continue
    emails.append({"to": email, "nome_empresa": empresa})
    print(f"  OK   [{150+i}] {empresa} <{email}>")

print(f"\nTotal para enviar: {len(emails)} de {len(batch)} na batch")

if not emails:
    print("Nenhum email. Encerrando.")
    import sys; sys.exit(0)

ctx = ssl.create_default_context()
ok = fail = 0
errors = []

for idx, entry in enumerate(emails):
    to = entry["to"]
    empresa = entry["nome_empresa"]
    cid = hashlib.md5(to.encode()).hexdigest()[:12]
    html_content = html.replace("{{CONTACT_ID}}", cid)

    payload = json.dumps({
        "subject": SUBJECT,
        "html": html_content,
        "emails": [entry]
    }).encode()

    req = urllib.request.Request(URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST")

    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        body = resp.read().decode()
        ok += 1
        print(f"  OK [{idx+1}/{len(emails)}] {empresa} -> HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:150]
        fail += 1
        errors.append({"email": to, "status": e.code, "body": body})
        print(f"  FAIL [{idx+1}/{len(emails)}] {empresa} -> HTTP {e.code}: {body}")
    except Exception as e:
        fail += 1
        errors.append({"email": to, "error": str(e)})
        print(f"  FAIL [{idx+1}/{len(emails)}] {empresa} -> {e}")

    time.sleep(RATE)

print()
print("="*60)
print("RELATORIO FINAL - Dia 1 - Contatos 151-200")
print("="*60)
print(f"Subject: {SUBJECT}")
print(f"Template: dia-01-rdo-tecnico.html")
print(f"Total batch: {len(batch)} contatos")
print(f"Com email: {len(emails)}")
print(f"Enviados com sucesso: {ok}")
print(f"Falhas: {fail}")
if errors:
    print()
    print("Detalhes das falhas:")
    for e in errors:
        print(f"  - {e.get('email','?')}: status={e.get('status','?')} body={e.get('body','')[:80]}")
print()
print(f"Rate: {RATE}s entre envios")
print("CCO: NAO")
