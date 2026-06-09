"""Full lead check - outputs summary and CSV of new leads."""
import csv, os, hashlib, re, json

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
STATUS_DIR = os.path.join(PROJ_DIR, "status_individual")
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")
REPORT_FILE = os.path.join(PROJ_DIR, "_lead_report.txt")

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

# Check hash
current_hash = _hash_csv()
stored_hash = ""
if os.path.exists(HASH_FILE):
    with open(HASH_FILE) as f:
        stored_hash = f.read().strip()

csv_mudou = current_hash != stored_hash

# Find new leads
novos = []
for c in contatos:
    if not os.path.exists(status_path(c["email"])):
        novos.append(c)

# Count real status files (excluding garbage-scraped ones)
real_status = sum(1 for c in contatos if os.path.exists(status_path(c["email"])))

# Total JSON files (all)
total_status_files = len([f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")])

lines = []
lines.append(f"RELATORIO DE VERIFICACAO DE LEADS")
lines.append(f"Data: 2026-06-08")
lines.append(f"")
lines.append(f"=== RESUMO ===")
lines.append(f"Total contatos com email no CSV: {len(contatos)}")
lines.append(f"Contatos com status (nao novos): {len(contatos) - len(novos)}")
lines.append(f"Novos leads detectados: {len(novos)}")
lines.append(f"Total de arquivos JSON em status_individual: {total_status_files}")
lines.append(f"Hash do CSV mudou?: {'SIM' if csv_mudou else 'NAO'}")
lines.append(f"")

if novos:
    lines.append(f"=== NOVOS LEADS ===")
    for n in novos:
        lines.append(f"  - {n['nome']} <{n['email']}>")
        lines.append(f"    Path esperado: {sanitizar(n['email'])}.json")
else:
    lines.append(f"Nenhum lead novo encontrado.")
    lines.append(f"Todos os contatos com email no CSV ja possuem arquivo de status.")

if csv_mudou:
    lines.append(f"")
    lines.append(f"ATENCAO: O hash do CSV mudou. A funcao csv_mudou() retorna True,")
    lines.append(f"mas isso so e relevante se houverem novos leads sem status.")

lines.append(f"")
lines.append(f"Hash atual: {current_hash[:16]}...")
lines.append(f"Hash salvo: {stored_hash[:16] if stored_hash else '(nenhum)'}...")

report = "\n".join(lines)
with open(REPORT_FILE, "w", encoding="utf-8") as f:
    f.write(report)

print(report)
