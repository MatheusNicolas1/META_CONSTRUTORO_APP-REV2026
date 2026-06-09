"""Compute SHA256 of contatos_master.csv and list contacts without status files."""
import hashlib
import os
import sys
import csv
import json

proj_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
csv_path = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
status_dir = os.path.join(proj_dir, "status_individual")
hash_file = os.path.join(status_dir, "_hash_csv.txt")

# Read saved hash
saved_hash = ""
if os.path.exists(hash_file):
    with open(hash_file) as f:
        saved_hash = f.read().strip()

# Compute current hash
with open(csv_path, "rb") as f:
    current_hash = hashlib.sha256(f.read()).hexdigest()

print(f"Hash salvo: {saved_hash[:20]}...")
print(f"Hash atual: {current_hash[:20]}...")
print(f"CSV mudou? {'SIM' if current_hash != saved_hash else 'NÃO'}")
print()

# Load contacts
def sanitizar(email):
    import re
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

contatos_com_email = []
total_linhas = 0
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        total_linhas += 1
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos_com_email.append({"idx": i, "nome": nome, "email": email, "linha": i+2})

print(f"Total de linhas no CSV (exceto cabeçalho): {total_linhas}")
print(f"Contatos com email: {len(contatos_com_email)}")

# Count status files
status_files = [f for f in os.listdir(status_dir) if f.endswith(".json") and not f.startswith("_")]
print(f"Arquivos de status: {len(status_files)}")

# Find new leads (no status file)
novos = []
for c in contatos_com_email:
    sp = os.path.join(status_dir, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

print(f"\nNovos leads detectados (sem status): {len(novos)}")
for n in novos:
    print(f"   - {n['nome']} <{n['email']}> (linha {n['linha']})")

if not novos and current_hash == saved_hash:
    print("\n✅ Nenhum lead novo. Hash coincide. Tudo ok.")
elif not novos and current_hash != saved_hash:
    print("\n⚠️ Hash diferente, mas todos os contatos já têm status (já processados antes).")
    print("   Isso significa que o hash foi resetado mas os leads já foram onboardados.")
