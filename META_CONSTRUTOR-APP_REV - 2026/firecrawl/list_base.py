import json

with open('.firecrawl/leads/base-consolidada.json') as f:
    leads = json.load(f)

# Emails únicos
emails_unicos = []
seen = set()
for l in leads:
    e = l['email'].strip().lower()
    if e not in seen:
        seen.add(e)
        emails_unicos.append(l)

print('=== BASE COMPLETA DE EMAILS ===')
for i, l in enumerate(emails_unicos, 1):
    nm = l['name']
    em = l['email']
    ct = l['city']
    uf = l['uf']
    sc = l['source']
    tp = l['type']
    print(f'{i}. {em} | {nm} | {ct}/{uf} | {sc} | {tp}')
