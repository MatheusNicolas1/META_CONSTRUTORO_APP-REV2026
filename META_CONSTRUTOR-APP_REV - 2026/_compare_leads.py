"""Compare CSV leads vs status files to find new leads."""
import csv
import os
import re

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:\"/\\\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Load all contatos from CSV
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

print(f"Total contatos no CSV com email: {len(contatos)}")

# List all status files (without _hash)
status_files = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"Total status files existentes: {len(status_files)}")

# Cross-reference
sem_status = []
com_status = []
for c in contatos:
    sp = status_path(c["email"])
    if os.path.exists(sp):
        com_status.append(c)
    else:
        sem_status.append(c)

print(f"Com status: {len(com_status)}")
print(f"Sem status (novos): {len(sem_status)}")
print()

if sem_status:
    print("📋 NOVOS LEADS DETECTADOS:")
    for n in sem_status:
        print(f"   - {n['nome']} <{n['email']}>")
else:
    print("✅ Nenhum lead novo detectado.")

# Also dump the emails from contatos with status for comparison
print("\n--- Contatos com status (emails) ---")
for c in com_status:
    print(f"   {c['email']}")

print("\n--- Contatos SEM status ---")
for c in sem_status:
    print(f"   {c['email']}")
