import json

# Carrega base nova (107 emails)
with open('.firecrawl/leads/base-consolidada.json') as f:
    base_nova = json.load(f)

# Parse da base antiga (emails_prospeccao.txt)
with open('emails_prospeccao.txt') as f:
    linhas = f.readlines()

base_antiga = []
for linha in linhas:
    linha = linha.strip()
    if not linha or linha.startswith('#') or linha.startswith('|'):
        continue
    # Formato: "email@dominio.com   # Nome da Empresa"
    if '  # ' in linha:
        partes = linha.split('  # ')
        email = partes[0].strip()
        nome = partes[1].strip() if len(partes) > 1 else 'Construtora (base antiga)'
    else:
        email = linha.strip()
        nome = 'Construtora (base antiga)'
    
    if email:
        base_antiga.append({
            'name': nome,
            'city': 'Nacional',
            'uf': 'BR',
            'email': email.lower(),
            'source': 'Ranking anterior',
            'type': 'construtora'
        })

print(f'Base antiga: {len(base_antiga)} emails')

# Unificar (deduplicar por email)
todos = base_antiga + base_nova
unicos = []
seen = set()
for l in todos:
    e = l['email'].strip().lower()
    if e not in seen:
        seen.add(e)
        unicos.append(l)

print(f'Base nova: {len(base_nova)} emails')
print(f'Total unificado: {len(unicos)} emails únicos')
print(f'Removidas duplicatas: {len(todos) - len(unicos)}')

# Salvar base master
master = {
    'metadata': {
        'total_unique': len(unicos),
        'total_antiga': len(base_antiga),
        'total_nova': len(base_nova),
        'duplicatas_removidas': len(todos) - len(unicos),
        'ultima_atualizacao': '2026-06-07'
    },
    'leads': unicos
}

with open('.firecrawl/leads/leads-master.json', 'w') as f:
    json.dump(unicos, f, indent=2, ensure_ascii=False)

# Estatísticas por UF
from collections import Counter
ufs = Counter(l['uf'] for l in unicos)
fontes = Counter(l['source'] for l in unicos)
tipos = Counter(l['type'] for l in unicos)

print()
print('=== BASE MASTER CRIADA ===')
print(f'Arquivo: .firecrawl/leads/leads-master.json')
print()
print('--- POR UF ---')
for uf, count in sorted(ufs.items(), key=lambda x: -x[1]):
    print(f'{uf}: {count}')
print()
print('--- POR FONTE ---')
for f, count in sorted(fontes.items(), key=lambda x: -x[1]):
    print(f'{f}: {count}')
print()
print('--- POR TIPO ---')
for t, count in sorted(tipos.items(), key=lambda x: -x[1]):
    print(f'{t}: {count}')

# Listar todos
print()
print('=== LISTA COMPLETA ===')
for i, l in enumerate(unicos, 1):
    nm = l['name']
    em = l['email']
    uf = l['uf']
    sc = l['source']
    tp = l['type']
    print(f'{i}. {em} | {nm} | {uf} | {sc} | {tp}')
