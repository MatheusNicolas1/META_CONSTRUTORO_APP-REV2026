#!/usr/bin/env python3
"""
ENVIO DIA 1 - CONTATOS 151-200
Executado diretamente no contexto Hermes.
"""
import csv, json, time, urllib.request, urllib.error, ssl, os, hashlib

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(BASE)

CSV_PATH = "contatos_master_atualizado.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"
RATE = 0.5

# Read template
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# Read CSV
with open(CSV_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

batch = rows[150:200]
print(f"CSV total: {len(rows)} linhas")
print(f"Batch 151-200: {len(batch)} contatos\n")

# Build email list
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

print(f"\nTotal para enviar: {len(emails)}")

if not emails:
    print("Nenhum email. Encerrando.")
    import sys; sys.exit(0)

# Send
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
        print(f"  ✓ [{idx+1}/{len(emails)}] {empresa} -> {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:150]
        fail += 1
        errors.append({"email": to, "status": e.code})
        print(f"  ✗ [{idx+1}/{len(emails)}] {empresa} -> HTTP {e.code}: {body}")
    except Exception as e:
        fail += 1
        errors.append({"email": to, "error": str(e)})
        print(f"  ✗ [{idx+1}/{len(emails)}] {empresa} -> {e}")

    time.sleep(RATE)

print("\n" + "="*60)
print("RESUMO - Dia 1 - Contatos 151-200")
print("="*60)
print(f"Subject: {SUBJECT}")
print(f"Total batch: {len(batch)}")
print(f"Com email: {len(emails)}")
print(f"Sucesso: {ok}")
print(f"Falhas: {fail}")
if errors:
    print(f"Erros: {[e.get('email','?') + ': ' + str(e.get('status',e.get('error','?'))) for e in errors]}")
print(f"Rate: {RATE}s")
print("CCO: NAO")
