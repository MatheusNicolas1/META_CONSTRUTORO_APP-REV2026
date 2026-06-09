"""Simulate onboard_novo_lead.py --verificar and --processar logic."""
import hashlib, csv, json, os, re

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")
PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

def _hash_csv():
    with open(CONTATOS_CSV, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Check hash match
atual = _hash_csv()
with open(HASH_FILE) as f:
    salvo = f.read().strip()

print(f"Current hash: {atual[:20]}...")
print(f"Saved hash:   {salvo[:20]}...")
print(f"Match: {atual == salvo}")

# Load contacts with email
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

# Find new leads (no status file)
novos = []
for c in contatos:
    if not os.path.exists(status_path(c["email"])):
        novos.append(c)

print(f"\nTotal contatos no CSV com email: {len(contatos)}")
print(f"Total com status: {len(contatos) - len(novos)}")
print(f"Novos leads: {len(novos)}")

if novos:
    print(f"\n📋 {len(novos)} novo(s) lead(s) detectado(s):")
    for n in novos:
        print(f"   - {n['nome']} <{n['email']}>")
else:
    print("\n✅ Nenhum lead novo. Todos já processados.")
