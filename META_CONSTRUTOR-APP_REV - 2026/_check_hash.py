"""Quick hash check for CSV change detection."""
import hashlib, os, csv, re, json

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")
OUTPUT = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_check_result.txt"

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Current hash
with open(CONTATOS_CSV, "rb") as f:
    cur_hash = hashlib.sha256(f.read()).hexdigest()

lines = []
lines.append(f"Current CSV hash: {cur_hash}")

if os.path.exists(HASH_FILE):
    with open(HASH_FILE) as f:
        saved = f.read().strip()
    lines.append(f"Saved hash:       {saved}")
    if cur_hash == saved:
        lines.append("HASH_MATCH: True (CSV unchanged)")
    else:
        lines.append("HASH_MATCH: False (CSV CHANGED!)")
else:
    lines.append("No saved hash file.")
    lines.append("HASH_MATCH: False")

# Count contacts with emails
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

lines.append(f"\nTotal contacts with email: {len(contatos)}")

# Check which have status
com_status = 0
sem_status = []
for c in contatos:
    sp = status_path(c["email"])
    if os.path.exists(sp):
        com_status += 1
    else:
        sem_status.append(c)

lines.append(f"With status file: {com_status}")
lines.append(f"Without status:   {len(sem_status)}")

if len(sem_status) > 0:
    lines.append(f"\nNEW LEADS ({len(sem_status)}):")
    for c in sem_status:
        lines.append(f"  - {c['nome']} <{c['email']}>")
else:
    lines.append("\nNo new leads detected.")

# Count actual status files (excluding hash)
arquivos = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
lines.append(f"\nTotal status files on disk: {len(arquivos)}")

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("\n".join(lines))
