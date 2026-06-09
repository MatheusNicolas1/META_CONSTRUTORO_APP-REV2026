"""Comprehensive new lead detection - manual analysis."""
import csv, os, re, json, hashlib

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:\"/\\\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Load CSV contatos
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        raw_email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if raw_email:
            # Handle multi-email cells (separated by ; or |)
            emails = [e.strip() for e in re.split(r'[;|]', raw_email) if e.strip() and '@' in e]
            for e in emails:
                contatos.append({"idx": i, "nome": nome, "email": e})

print(f"Total email entries from CSV: {len(contatos)}")

# Also count by unique email
unique_emails = set(c["email"].lower() for c in contatos)
print(f"Unique emails: {len(unique_emails)}")

# Load all actual status files
status_fnames = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"Status files: {len(status_fnames)}")

# Get emails from status files
status_emails_found = set()
for fname in status_fnames:
    fpath = os.path.join(STATUS_DIR, fname)
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "email" in data:
                status_emails_found.add(data["email"].lower())
    except:
        pass

print(f"Emails in status files: {len(status_emails_found)}")

# Find new leads
new_leads = []
for c in contatos:
    if c["email"].lower() not in status_emails_found:
        new_leads.append(c)

print(f"\n{'='*60}")
if new_leads:
    print(f"📋 {len(new_leads)} NOVO(S) LEAD(S) DETECTADO(S):")
    for n in new_leads:
        print(f"   [line ~{n['idx']+2}] {n['nome']} <{n['email']}>")
    print(f"\nConclusão: Novos leads encontrados! Executar --processar.")
else:
    print("✅ Nenhum lead novo. Todos já processados.")
    print("Conclusão: Nada a fazer.")
