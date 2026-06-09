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

# Find novos (leads that don't have status files)
novos = []
for c in contatos:
    sp = os.path.join(status_dir, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

# Count existing status files (non-hash)
status_files = [f for f in os.listdir(status_dir) if f.endswith(".json") and not f.startswith("_")]
leads_com_status = len(status_files)

print(f"RESUMO:")
print(f"  Total contatos no CSV: {len(contatos)}")
print(f"  Contatos com status:   {leads_com_status}")
print(f"  Hash atual:            {current_hash[:16]}...")
print(f"  Hash salvo:            {saved_hash[:16] if saved_hash else '(vazio)'}...")
print(f"  Hash CSV mudou:        {'SIM' if not hash_match else 'NÃO'}")
print(f"")
print(f"  Novos leads:           {len(novos)}")
print()

if novos:
    print("LISTA DE NOVOS LEADS:")
    for i, n in enumerate(novos, 1):
        print(f"  {i:3d}. {n['nome']:40s} <{n['email']}>")
else:
    print("✅ Nenhum lead novo detectado. Todos os contatos no CSV já possuem status.")
    print("   Não é necessário executar --processar.")
