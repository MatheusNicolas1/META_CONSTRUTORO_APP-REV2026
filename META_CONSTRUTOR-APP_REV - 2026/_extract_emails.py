"""Extract all emails from contatos_master.csv."""
import csv
import os

CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"

contatos = []
with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        email = row.get("email", "").strip()
        nome = row.get("nome", "").strip() or "Lead"
        if email:
            contatos.append({"idx": i, "nome": nome, "email": email})

print(f"Total contatos com email: {len(contatos)}")
for c in contatos:
    print(f"  [{c['idx']}] {c['nome']} | {c['email']}")
