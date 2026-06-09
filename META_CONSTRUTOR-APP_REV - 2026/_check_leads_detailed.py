"""Script: count all contacts with emails from CSV and cross-reference with status files."""
import csv
import os
import re
import json

PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = os.path.join(PROJ_DIR, "status_individual")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

def status_path(email):
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")

# Load contacts from CSV
contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

# Collect all status emails from files
# Also load status files to see their emails
status_files_metadata = []
for fname in os.listdir(STATUS_DIR):
    if fname.endswith(".json") and not fname.startswith("_"):
        fpath = os.path.join(STATUS_DIR, fname)
        try:
            with open(fpath, encoding="utf-8") as fh:
                d = json.load(fh)
            status_email = d.get("email", "")
            status_files_metadata.append({"file": fname, "email": status_email})
        except (json.JSONDecodeError, Exception):
            status_files_metadata.append({"file": fname, "email": "(parse_error)"})

print(f"Total de contatos com email no CSV: {len(contatos)}")
print(f"Total de arquivos de status JSON: {len(status_files_metadata)}")

# Build set of emails that have status
emails_com_status = set()
for sfm in status_files_metadata:
    if sfm["email"] and sfm["email"] != "(parse_error)":
        emails_com_status.add(sfm["email"].strip().lower())

# Also check via path
com_status_path = sum(1 for c in contatos if os.path.exists(status_path(c["email"])))

# But also include from the JSON data
novos_csv_path = [c for c in contatos if not os.path.exists(status_path(c["email"]))]
novos_csv_json = [c for c in contatos if c["email"].strip().lower() not in emails_com_status]

print(f"\nPor path de arquivo: {len(contatos) - len(novos_csv_path)} com status, {len(novos_csv_path)} novos")
print(f"Por dado do JSON: {len(contatos) - len(novos_csv_json)} com status, {len(novos_csv_json)} novos")

# Show discrepancy if any
if len(novos_csv_path) != len(novos_csv_json):
    print("\n⚠️ Discrepância entre path e JSON data!")
    # Show contacts in path-novos but not in json-novos
    diff = set(c["email"] for c in novos_csv_path) - set(c["email"] for c in novos_csv_json)
    if diff:
        for e in diff:
            print(f"  - Tem arquivo de status mas email não encontrado no JSON: {e}")

# Full list of new contacts (by path, which is what the script uses)
print(f"\n📋 Novos leads (por path): {len(novos_csv_path)}")
for n in novos_csv_path:
    print(f"   - {n['nome']} <{n['email']}>")
