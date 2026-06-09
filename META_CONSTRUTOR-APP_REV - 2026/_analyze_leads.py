"""Full analysis of new leads using only built-in Python (no terminal needed)."""
import json
import csv
import os
import hashlib
import re

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:\"/\\\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

def _hash_csv():
    with open(CONTATOS_CSV, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def carregar_contatos():
    contatos = []
    with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            email = row.get("email", "").strip()
            nome = row.get("nome", "").strip() or "Lead"
            if email:
                contatos.append({"idx": i, "nome": nome, "email": email})
    return contatos

os.makedirs(STATUS_DIR, exist_ok=True)

# --- Hash comparison ---
current_hash = _hash_csv()
saved_hash = None
if os.path.exists(HASH_FILE):
    with open(HASH_FILE) as f:
        saved_hash = f.read().strip()

print(f"Hash atual:     {current_hash[:32]}...")
print(f"Hash salvo:     {saved_hash[:32] if saved_hash else '(nenhum)'}...")
csv_mudou = saved_hash is None or current_hash != saved_hash
print(f"CSV mudou?      {'SIM' if csv_mudou else 'NÃO'}")
print()

# --- Count all contatos ---
contatos = carregar_contatos()
print(f"Contatos no CSV com email: {len(contatos)}")

# --- Status files count ---
all_status_files = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"Arquivos de status: {len(all_status_files)}")
print()

# --- Find new leads ---
novos = []
for c in contatos:
    sp = status_path(c["email"])
    if not os.path.exists(sp):
        novos.append(c)

if novos:
    print(f"📋 {len(novos)} NOVO(S) LEAD(S) DETECTADO(S):")
    for n in novos:
        print(f"   - {n['nome']} <{n['email']}>")
else:
    print("✅ Nenhum lead novo. Todos já processados.")

print()
print(f"Conclusão: {'Novos leads encontrados para processar!' if novos else 'Nada a fazer.'}")
