import csv, json, time, urllib.request, urllib.error, os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

CSV_PATH = "lista_prospeccao_construtoras.csv"
TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
SUBJECT = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"

with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    template = f.read()

contacts = []
with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if 50 <= i <= 99:
            e = (row.get("email") or "").strip()
            n = (row.get("empresa") or "").strip()
            if e and n:
                contacts.append({"to": e, "nome_empresa": n})

print(f"Total: {len(contacts)}")
ok, fail = 0, 0
errs = []

for idx, c in enumerate(contacts):
    html = template.replace("{{nome_empresa}}", c["nome_empresa"])
    payload = {"subject": SUBJECT, "html": html, "emails": [{"to": c["to"], "nome_empresa": c["nome_empresa"]}]}
    req = urllib.request.Request(URL, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"[{idx+1}/{len(contacts)}] OK {c['to']} | {r.status}")
            ok += 1
    except urllib.error.HTTPError as e:
        b = e.read().decode(errors="replace")[:200]
        print(f"[{idx+1}/{len(contacts)}] FAIL {c['to']} | HTTP {e.code}: {b}")
        fail += 1; errs.append({"to": c["to"], "err": f"HTTP {e.code}"})
    except Exception as e:
        print(f"[{idx+1}/{len(contacts)}] FAIL {c['to']} | {e}")
        fail += 1; errs.append({"to": c["to"], "err": str(e)[:200]})
    if idx < len(contacts) - 1:
        time.sleep(0.5)

print(f"\n=== RESUMO: {ok} OK, {fail} FALHAS ===")
with open("dia01_resultado.txt", "w", encoding="utf-8") as f:
    f.write(f"Dia 1 - OK:{ok} Fail:{fail}\n")
    for c in contacts:
        f.write(f"  {c['to']} ({c['nome_empresa']})\n")
    if errs:
        f.write("\nErros:\n")
        for e in errs:
            f.write(f"  {e['to']}: {e['err']}\n")
