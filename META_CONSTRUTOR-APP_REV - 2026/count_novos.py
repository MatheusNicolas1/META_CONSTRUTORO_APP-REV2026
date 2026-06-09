"""Get exact count of contacts with email and status."""
import csv, hashlib, os, re, json

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

# Load contacts
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

# Count status files (non-_ prefixed .json)
status_files = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"Total status JSON files: {len(status_files)}")
print(f"Total contacts in CSV with email: {len(contatos)}")

# Check which emails have status
novos = []
for c in contatos:
    sp = os.path.join(STATUS_DIR, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

print(f"Contacts with status: {len(contatos) - len(novos)}")
print(f"New contacts (no status): {len(novos)}")
if novos:
    for n in novos:
        print(f"  NOVO: '{n['nome']}' <{n['email']}>")
else:
    print("Nenhum lead novo!")
