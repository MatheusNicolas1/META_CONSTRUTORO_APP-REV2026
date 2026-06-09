import csv, os, json, hashlib, re

csv_path = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
status_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
hash_file = os.path.join(status_dir, "_hash_csv.txt")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

# Load contatos
contatos = []
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"nome": nome, "email": email})

# Compute current hash
with open(csv_path, "rb") as f:
    current_hash = hashlib.sha256(f.read()).hexdigest()

# Read saved hash
saved_hash = ""
if os.path.exists(hash_file):
    with open(hash_file) as f:
        saved_hash = f.read().strip()

hash_match = (current_hash == saved_hash)

# Find novos
novos = []
for c in contatos:
    sp = os.path.join(status_dir, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

print(f"CSV contatos: {len(contatos)}")
print(f"Hash atual:   {current_hash[:16]}...")
print(f"Hash salvo:   {saved_hash[:16] if saved_hash else '(nenhum)'}...")
print(f"Hash match:   {hash_match}")
print(f"Novos leads:  {len(novos)}")
print()
if novos:
    print("NOVOS LEADS:")
    for n in novos:
        print(f"  - {n['nome']} <{n['email']}>")
else:
    print("Nenhum lead novo detectado.")
