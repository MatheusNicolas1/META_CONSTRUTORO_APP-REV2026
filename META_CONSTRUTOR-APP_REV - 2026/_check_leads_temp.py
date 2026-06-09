"""Temporary script: count contacts with email in CSV vs status files."""
import csv
import os
import hashlib
import json
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

# Load contacts
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

# Count status files (that are actual lead status files, not _hash_csv)
status_arquivos = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]

print(f"Total de contatos com email no CSV: {len(contatos)}")
print(f"Total de arquivos de status: {len(status_arquivos)}")

# Check how many have status
com_status = sum(1 for c in contatos if os.path.exists(status_path(c["email"])))
print(f"Contatos com status: {com_status}")
print(f"Contatos sem status (novos): {len(contatos) - com_status}")

# List new leads
novos = [c for c in contatos if not os.path.exists(status_path(c["email"]))]
if novos:
    print(f"\n📋 {len(novos)} novo(s) lead(s) detectado(s):")
    for n in novos:
        print(f"   - {n['nome']} <{n['email']}>")
else:
    print("\n✅ Nenhum lead novo.")

# Current hash
current_hash = _hash_csv()
print(f"\nHash atual do CSV: {current_hash[:16]}...")

# Stored hash
if os.path.exists(HASH_FILE):
    with open(HASH_FILE) as f:
        stored_hash = f.read().strip()
    print(f"Hash salvo:         {stored_hash[:16]}...")
    print(f"CSV mudou? {'SIM' if current_hash != stored_hash else 'NÃO'}")
else:
    print("Hash salvo: (nenhum)")
    print("CSV mudou? SIM (primeira vez)")
