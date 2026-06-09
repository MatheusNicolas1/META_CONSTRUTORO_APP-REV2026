"""Extract clean email addresses from CSV and compare with status files."""
import csv, hashlib, os, re, json

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

def _hash_csv():
    with open(CONTATOS_CSV, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

# Load all contacts from CSV
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email_raw = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        # Split by | or ; to get individual emails
        emails = re.split(r'\s*[|;]\s*', email_raw)
        for e in emails:
            e = e.strip()
            # Only include real email addresses (not garbage like js@0.2.81, bootstrap@5.1.3, etc.)
            if e and re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', e):
                contatos.append({"nome": nome, "email": e.lower()})

print(f"Clean email addresses in CSV: {len(contatos)}")

# Check hash
atual = _hash_csv()
with open(HASH_FILE) as f:
    salvo = f.read().strip()

print(f"Hash match: {atual == salvo}")

# Find new leads
novos = []
for c in contatos:
    sp = os.path.join(STATUS_DIR, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

print(f"With status: {len(contatos) - len(novos)}")
print(f"New leads: {len(novos)}")

if novos:
    for n in novos:
        print(f"  NOVO: '{n['nome']}' <{n['email']}>")
else:
    print("✅ No new leads found.")

# Output to a file too for inspection
with open(os.path.join(os.path.dirname(__file__), "resultado_verificacao.txt"), "w") as f:
    f.write(f"Total contatos: {len(contatos)}\n")
    f.write(f"Novos: {len(novos)}\n")
    f.write(f"Hash match: {atual == salvo}\n\n")
    f.write(f"Hash atual: {atual}\n")
    f.write(f"Hash salvo: {salvo}\n\n")
    if novos:
        f.write("NOVOS LEADS:\n")
        for n in novos:
            f.write(f"  {n['nome']} <{n['email']}>\n")
