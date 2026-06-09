import hashlib, csv, os, re, json

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
STATUS_DIR = os.path.join(PROJ_DIR, "status_individual")
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")
STORED_HASH = "af3be25b078e24619e3939ee5a684926e4a055e83840b6acff41ed7f16ecc30b"

# Compute current hash
import hashlib
with open(CONTATOS_CSV, "rb") as f:
    current_hash = hashlib.sha256(f.read()).hexdigest()

print(f"CURRENT: {current_hash}")
print(f"STORED:  {STORED_HASH}")
print(f"MATCH:   {current_hash == STORED_HASH}")

# Count contacts with emails
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

print(f"\nTotal contacts with email: {len(contatos)}")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Check which contacts have status
sem_status = []
for c in contatos:
    sp = status_path(c["email"])
    if not os.path.exists(sp):
        sem_status.append(c)

print(f"Without status (new): {len(sem_status)}")
if sem_status:
    print("\n=== NEW LEADS ===")
    for n in sem_status:
        # Check what status files exist that might match partially (different email format)
        print(f"  [{n['nome']}] <{n['email']}>")
        print(f"    Expected file: {os.path.basename(status_path(n['email']))}")
else:
    print("\nNo new leads found.")
