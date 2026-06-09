#!/usr/bin/env python3
"""
Automated leads check for Meta Construtor.
Compares contatos_master.csv against status_individual/*.json
to determine new leads without relying on hash.
"""
import csv, os, re, json, hashlib

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual"
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")

def sanitizar(email):
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s

# --- Load status files ---
status_files = set()
for f in os.listdir(STATUS_DIR):
    if f.endswith(".json") and not f.startswith("_"):
        status_files.add(f)

# --- Load CSV contacts with email ---
contatos_com_email = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos_com_email.append({"nome": nome, "email": email})

# --- Find new leads (no status file) ---
novos = []
for c in contatos_com_email:
    sf_name = f"{sanitizar(c['email'])}.json"
    if sf_name not in status_files:
        novos.append(c)

# --- Hash state ---
saved_hash = ""
if os.path.exists(HASH_FILE):
    with open(HASH_FILE, "r") as f:
        saved_hash = f.read().strip()

with open(CONTATOS_CSV, "rb") as f:
    current_hash = hashlib.sha256(f.read()).hexdigest()

csv_mudou = saved_hash != current_hash

# --- Report ---
print("=" * 60)
print(f"Total contatos com email no CSV: {len(contatos_com_email)}")
print(f"Total arquivos de status:        {len(status_files)}")
print(f"Hash salvo:                      {saved_hash[:16]}...")
print(f"Hash atual:                      {current_hash[:16]}...")
print(f"CSV mudou (hash diff):           {'SIM' if csv_mudou else 'NÃO'}")
print(f"Novos leads detectados:          {len(novos)}")
print("=" * 60)

if novos:
    print("\n--- NOVOS LEADS (sem status) ---")
    for i, c in enumerate(novos, 1):
        print(f"{i}. {c['nome']} <{c['email']}>")
    print()

    # --- Process: send emails ---
    print("--- PROCESSANDO NOVOS LEADS... ---")
    # This would call the real send logic
    # For now, just create status files and report
    for c in novos:
        sf_name = sanitizar(c["email"]) + ".json"
        sf_path = os.path.join(STATUS_DIR, sf_name)
        if not os.path.exists(sf_path):
            with open(sf_path, "w") as f:
                json.dump({
                    "email": c["email"],
                    "nome": c["nome"],
                    "iniciado_em": "2026-06-08"
                }, f, ensure_ascii=False, indent=2)
            print(f"  ✓ Status criado: {sf_name}")
        else:
            print(f"  - Já existia: {sf_name}")

    # Update hash
    with open(HASH_FILE, "w") as f:
        f.write(f"1|{current_hash}")
    print(f"\n  ✓ Hash atualizado em _hash_csv.txt")

    print(f"\n--- RESUMO ---")
    print(f"Novos leads processados: {len(novos)}")
    print(f"E-mails disparados:      0 (simulação - requisição SMTP real)")
    print(f"Status criados:          {len(novos)}")

else:
    print("\nNenhum novo lead detectado.")
    if not csv_mudou:
        print("(Hash CSV compatível - nenhuma alteração desde última verificação)")
