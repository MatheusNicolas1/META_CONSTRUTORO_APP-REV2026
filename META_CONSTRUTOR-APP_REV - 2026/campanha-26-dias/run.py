try:
    import csv, json, time, urllib.request, urllib.error, os
    os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")
    
    CSV_PATH = "lista_prospeccao_construtoras.csv"
    TEMPLATE_PATH = "campanha-26-dias/dia-01-rdo-tecnico.html"
    URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
    SUBJECT = "Acabe com o RDO perdido no WhatsApp \u2014 Meta Construtor"
    
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_html = f.read()
    
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
        print("ERROR: No contacts with email found!")
        exit(1)
    
    success = 0; failed = 0; errors = []
    
    for idx, contact in enumerate(contacts):
        html = template_html.replace("{{nome_empresa}}", contact["nome_empresa"])
        payload = {
            "subject": SUBJECT,
            "html": html,
            "emails": [{"to": contact["to"], "nome_empresa": contact["nome_empresa"]}]
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            URL, data=data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
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
            failed += 1; errors.append({"to": contact["to"], "error": f"HTTP {e.code}"})
        except Exception as e:
            print(f"[{idx+1}/{len(contacts)}] FAIL -> {contact['to']} | {str(e)[:200]}")
            failed += 1; errors.append({"to": contact["to"], "error": str(e)[:200]})
        if idx < len(contacts) - 1:
            time.sleep(0.5)
    
    print("\n" + "=" * 60)
    print(f"RESUMO: {success} enviados, {failed} falhas")
    print("=" * 60)
    
    with open("dia01_resultado.txt", "w", encoding="utf-8") as f:
        f.write(f"Dia 1 - Campanha 26 E-mails - Meta Construtor\n")
        f.write(f"Subject: {SUBJECT}\n")
        f.write(f"Success: {success}, Failed: {failed}\n")
        for c in contacts:
            f.write(f"  - {c['to']} ({c['nome_empresa']})\n")
        if errors:
            f.write("\nErros:\n")
            for e in errors:
                f.write(f"  - {e['to']}: {e['error']}\n")
except Exception as e:
    print(f"ERRO FATAL: {e}")
