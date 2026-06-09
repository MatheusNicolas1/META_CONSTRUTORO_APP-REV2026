"""Direct hash check and lead detection - fully self-contained."""
import hashlib
import csv
import os
import re

csv_path = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'

# Current hash
with open(csv_path, 'rb') as f:
    current = hashlib.sha256(f.read()).hexdigest()

print(f"Hash atual do CSV: {current}")
saved_hash = 'af3be25b078e24619e3939ee5a684926e4a055e83840b6acff41ed7f16ecc30b'
print(f"Hash salvo:         {saved_hash}")
csv_mudou = current != saved_hash
print(f"CSV mudou: {csv_mudou}")
print()

# List all contacts from CSV with emails
contatos = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get('email', '').strip()
        nome = row.get('nome', '').strip() or 'Lead'
        if email:
            contatos.append({'idx': i, 'nome': nome, 'email': email})

print(f"Total contatos no CSV com email: {len(contatos)}")

# Check status files
status_dir = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'

def sanitizar(email):
    s = email.replace('@', '_at_').replace('.', '_dot_')
    s = re.sub(r'[<>:"/\\|?*]', '_', s)
    return s

novos = []
for c in contatos:
    sp = os.path.join(status_dir, f"{sanitizar(c['email'])}.json")
    if not os.path.exists(sp):
        novos.append(c)

if novos:
    print(f"\n📋 {len(novos)} NOVO(S) LEAD(S) DETECTADO(S):")
    for n in novos:
        print(f"   - {n['nome']} <{n['email']}>")
else:
    print("\n✅ Nenhum lead novo. Todos já processados.")

# Save results for possible processing
import json
result = {
    'csv_mudou': csv_mudou,
    'current_hash': current,
    'saved_hash': saved_hash,
    'total_contatos': len(contatos),
    'novos': novos
}
with open(os.path.join(status_dir, '_last_check_result.json'), 'w') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
