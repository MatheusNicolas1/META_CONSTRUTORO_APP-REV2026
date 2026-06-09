"""Cross-reference CSV emails vs status files."""
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

# List all status files
all_status_fnames = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
print(f"Total status files existentes: {len(all_status_fnames)}")
print()

# Check each contato
novos = []
existentes = []
for c in contatos:
    sp = status_path(c["email"])
    if os.path.exists(sp):
        existentes.append(c)
    else:
        novos.append(c)

print(f"COM status: {len(existentes)}")
print(f"SEM status (NOVOS): {len(novos)}")
print()

if novos:
    print("📋 NOVOS LEADS DETECTADOS:")
    for n in novos:
        print(f"   [linha ~{n['idx']+2}] {n['nome']} <{n['email']}>")
else:
    print("✅ Nenhum lead novo detectado.")

print()

# Also check: some status files might reference emails not in CSV anymore
# Extract emails from status files
status_emails = set()
for fname in all_status_fnames:
    fpath = os.path.join(STATUS_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            if "email" in data:
                status_emails.add(data["email"].lower())
        except:
            pass

csv_emails = set(c["email"].lower() for c in contatos)

orphaned = status_emails - csv_emails
if orphaned:
    print(f"⚠️ Status orphans (emails com status mas não no CSV): {len(orphaned)}")
    for oe in sorted(orphaned):
        print(f"   - {oe}")

import json
