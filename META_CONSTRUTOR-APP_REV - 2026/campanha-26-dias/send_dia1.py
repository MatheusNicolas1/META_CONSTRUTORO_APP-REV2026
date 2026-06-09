import csv, json, time, urllib.request, urllib.error, os, sys

def main():
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
    
    results = {"total": len(contacts), "ok": 0, "fail": 0, "errors": []}
    print(f"Total contacts: {results['total']}")
    
    subject = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"
    url = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
    
    for idx, c in enumerate(contacts):
        html = template.replace("{{nome_empresa}}", c["nome_empresa"])
        payload = {"subject": subject, "html": html, "emails": [{"to": c["to"], "nome_empresa": c["nome_empresa"]}]}
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                print(f"[{idx+1}/{results['total']}] OK {c['to']} | {r.status}")
                results["ok"] += 1
        except urllib.error.HTTPError as e:
            b = e.read().decode(errors="replace")[:200]
            print(f"[{idx+1}/{results['total']}] FAIL {c['to']} | HTTP {e.code}: {b}")
            results["fail"] += 1; results["errors"].append({"to": c["to"], "err": f"HTTP {e.code}"})
        except Exception as e:
            print(f"[{idx+1}/{results['total']}] FAIL {c['to']} | {e}")
            results["fail"] += 1; results["errors"].append({"to": c["to"], "err": str(e)[:200]})
        if idx < len(contacts) - 1:
            time.sleep(0.5)
    
    print(f"\n=== RESUMO: {results['ok']} OK, {results['fail']} FALHAS ===")
    
    with open("dia01_resultado.txt", "w", encoding="utf-8") as f:
        f.write(f"Dia 1 - Campanha 26 E-mails - Meta Construtor\n")
        f.write(f"Data: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Subject: {subject}\n")
        f.write(f"Total: {results['total']}, OK: {results['ok']}, Fail: {results['fail']}\n\n")
        for c in contacts:
            f.write(f"  {c['to']} ({c['nome_empresa']})\n")
        if results["errors"]:
            f.write("\nErros:\n")
            for e in results["errors"]:
                f.write(f"  {e['to']}: {e['err']}\n")
    
    return results

if __name__ == "__main__":
    r = main()
    sys.exit(0 if r["fail"] == 0 else 1)
