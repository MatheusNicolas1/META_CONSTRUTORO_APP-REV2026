"""
Send Dia 1 - Campaign 26 Days
This module auto-executes when imported by the Hermes agent.
"""
import csv, json, time, urllib.request, urllib.error, os, sys

_RESULT = None

def execute():
    global _RESULT
    os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")
    
    with open("campanha-26-dias/dia-01-rdo-tecnico.html", "r", encoding="utf-8") as f:
        template = f.read()
    
    contacts = []
    with open("lista_prospeccao_construtoras.csv", "r", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            if 50 <= i <= 99:
                e = (row.get("email") or "").strip()
                n = (row.get("empresa") or "").strip()
                if e and n:
                    contacts.append({"to": e, "nome_empresa": n})
    
    subj = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"
    url = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
    ok = fail = 0
    errs = []
    lines = []
    
    for idx, c in enumerate(contacts):
        html = template.replace("{{nome_empresa}}", c["nome_empresa"])
        payload = {"subject": subj, "html": html, "emails": [{"to": c["to"], "nome_empresa": c["nome_empresa"]}]}
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                lines.append(f"[{idx+1}/{len(contacts)}] OK -> {c['to']} ({c['nome_empresa'][:30]}...) | {r.status}")
                ok += 1
        except urllib.error.HTTPError as e:
            b = e.read().decode(errors="replace")[:200]
            lines.append(f"[{idx+1}/{len(contacts)}] FAIL -> {c['to']} | HTTP {e.code}")
            fail += 1; errs.append({"to": c["to"], "err": f"HTTP {e.code}: {b}"})
        except Exception as e:
            lines.append(f"[{idx+1}/{len(contacts)}] FAIL -> {c['to']} | {e}")
            fail += 1; errs.append({"to": c["to"], "err": str(e)[:200]})
        if idx < len(contacts) - 1:
            time.sleep(0.5)
    
    lines.append(f"\n=== RESUMO: {ok} OK, {fail} FALHAS ===")
    
    with open("dia01_resultado.txt", "w", encoding="utf-8") as f:
        f.write(f"Dia 1 - Campanha 26 E-mails\n")
        f.write(f"Subject: {subj}\n")
        f.write(f"OK: {ok}, Fail: {fail}\n\n")
        for c in contacts:
            f.write(f"  {c['to']} ({c['nome_empresa']})\n")
        if errs:
            f.write("\nErros:\n")
            for e in errs:
                f.write(f"  {e['to']}: {e['err']}\n")
    
    _RESULT = "\n".join(lines)
    return _RESULT

_RESULT = execute()
