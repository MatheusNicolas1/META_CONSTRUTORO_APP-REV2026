"""Extrair sites das construtoras do construtorasbrasil.json que NAO tem email"""
import json, os

BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
caminho = os.path.join(BASE_DIR, '.firecrawl', 'prospeccao-inicial', 'construtorasbrasil.json')

with open(caminho) as f:
    data = json.load(f)

construtoras = data.get('construtoras', [])
print(f'Total construtoras no JSON: {len(construtoras)}')

# Filtrar as que NAO tem email
sem_email = [c for c in construtoras if not c.get('email')]
com_site = [c for c in sem_email if c.get('site')]

print(f'Sem email: {len(sem_email)}')
print(f'Com site (potencial para enriquecer): {len(com_site)}')

# Mostrar distribuição por estado dos que tem site
from collections import Counter
estados = Counter()
for c in com_site:
    sigla = c.get('estado_sigla', '?')
    estados[sigla] += 1

print(f'\nPor estado (com site, sem email):')
for e in sorted(estados.keys()):
    print(f'  {e}: {estados[e]}')

# Salvar lista de sites para enriquecimento
sites_path = os.path.join(BASE_DIR, '.firecrawl', 'prospeccao-inicial', 'sites_para_enriquecer.txt')
with open(sites_path, 'w') as f:
    for c in com_site:
        site = c['site'].strip()
        if site:
            f.write(f"{site}\n")

print(f'\nLista de {len(com_site)} sites salva em: sites_para_enriquecer.txt')
print(f'Exemplo dos primeiros 10:')
for c in com_site[:10]:
    print(f'  - {c["site"]} ({c["nome"]}, {c.get("estado_sigla","")})')
