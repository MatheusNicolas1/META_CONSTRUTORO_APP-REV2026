"""Full analysis script - run with: cd to dir && python _full_analysis.py"""
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

# Current hash
with open(csv_path, "rb") as f:
    current_hash = hashlib.sha256(f.read()).hexdigest()

saved_hash = ""
if os.path.exists(hash_file):
    with open(hash_file) as f:
        saved_hash = f.read().strip()

hash_match = (current_hash == saved_hash)

# Check novos
novos = []
for c in contatos:
    sp = os.path.join(status_dir, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

# Existing status files count
status_files = [f for f in os.listdir(status_dir) if f.endswith(".json") and not f.startswith("_")]

print("=" * 60)
print("RELATÓRIO DE VERIFICAÇÃO DE NOVOS LEADS")
print("=" * 60)
print(f"Total contatos no CSV (com email):  {len(contatos)}")
print(f"Arquivos de status existentes:      {len(status_files)}")
print(f"Hash CSV mudou:                     {'SIM' if not hash_match else 'NÃO'}")
print(f"Hash atual:                         {current_hash[:20]}...")
print(f"Hash salvo:                         {saved_hash[:20] if saved_hash else '(vazio)'}...")
print()
if novos:
    print(f"🔔 {len(novos)} NOVO(S) LEAD(S) DETECTADO(S):")
    for n in novos:
        print(f"   - {n['nome']:40s} <{n['email']}>")
    print()
    print("💡 Execute --processar para enviar campanhas.")
else:
    print("✅ Nenhum lead novo detectado. Todos os contatos já processados.")
    print("   Não é necessário executar --processar.")
