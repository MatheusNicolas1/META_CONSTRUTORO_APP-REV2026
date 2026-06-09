"""Script to check leads status - runs onboard_novo_lead.py logic directly."""
import json
import csv
import os
import hashlib
import re

PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = os.path.join(PROJ_DIR, "status_individual")
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
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

# Current hash
cur_hash = _hash_csv()
print(f"Hash atual (CSV): {cur_hash[:16]}...")

# Saved hash
if os.path.exists(HASH_FILE):
    with open(HASH_FILE) as f:
        saved_hash = f.read().strip()
    print(f"Hash salvo:        {saved_hash[:16]}...")
    print(f"CSV mudou?         {'SIM' if cur_hash != saved_hash else 'NÃO'}")
else:
    print("Hash salvo: (nenhum)")
    print("CSV mudou?         Primeira execução")

# Count contacts
contatos = carregar_contatos()
print(f"\nTotal contatos no CSV: {len(contatos)}")

# Check status files
com_status = 0
sem_status = []
for c in contatos:
    sp = status_path(c["email"])
    if os.path.exists(sp):
        com_status += 1
    else:
        sem_status.append(c)

print(f"Com status: {com_status}")
print(f"Sem status: {len(sem_status)}")

if sem_status:
    print(f"\n=== LEADS SEM STATUS (NOVOS) ===")
    for c in sem_status:
        print(f"  - {c['nome']} <{c['email']}>")
else:
    print("\nNenhum lead novo detectado.")

# Show total status files in directory
arquivos = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"\nTotal arquivos de status: {len(arquivos)}")
