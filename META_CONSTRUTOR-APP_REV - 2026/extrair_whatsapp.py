"""Extrair telefones dos batches e gerar leads_whatsapp.csv + unificado"""
import json, csv, re, os

BATCH_DIR = '.firecrawl/prospeccao-inicial'

def formatar_whatsapp(tel):
    dig = re.sub(r'\D', '', tel)
    if len(dig) >= 10:
        if not dig.startswith('55'):
            dig = '55' + dig
        return dig
    return None

# Carregar telefones dos batches
telefones_por_site = {}
for fname in ['enriquecidos_batch1.json', 'enriquecidos_batch2.json', 'enriquecidos_batch3.json']:
    path = os.path.join(BATCH_DIR, fname)
    if os.path.exists(path):
        with open(path) as f:
            dados = json.load(f)
        for item in dados:
            site = item.get('site', '').lower().strip()
            tels = []
            for t in item.get('telefones_encontrados', []):
                wpp = formatar_whatsapp(t)
                if wpp and len(set(tels + [wpp])) > len(tels):
                    tels.append(wpp)
            if tels:
                telefones_por_site[site] = tels[:3]

print(f'Sites com telefone: {len(telefones_por_site)}')

# Carregar leads com email
with open('leads_teste_com_email.csv') as f:
    reader = csv.DictReader(f)
    leads = list(reader)

print(f'Total leads: {len(leads)}')

# Cruzar
resultados = []
for l in leads:
    site = l.get('site', '').lower().strip()
    tels = telefones_por_site.get(site, [])
    resultados.append({
        'nome': l['nome'],
        'email': l['email'],
        'site': l['site'],
        'whatsapp': '; '.join(tels) if tels else '',
        'estado': l.get('estado', ''),
        'cidade': l.get('cidade', ''),
    })

# Estatisticas
com_wpp = [r for r in resultados if r['whatsapp']]
sem_wpp = [r for r in resultados if not r['whatsapp']]
print(f'\nCom WhatsApp: {len(com_wpp)}')
print(f'Sem WhatsApp: {len(sem_wpp)}')

# Salvar CSV WhatsApp
with open('leads_whatsapp.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'whatsapp', 'email', 'site', 'estado', 'cidade']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in com_wpp:
        writer.writerow({k: r[k] for k in fieldnames})
print(f'\n✅ leads_whatsapp.csv salvo com {len(com_wpp)} contatos')

# Salvar UNIFICADO (todos com email + wpp se tiver)
with open('leads_unificado.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'email', 'whatsapp', 'site', 'estado', 'cidade']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in resultados:
        writer.writerow({k: r[k] for k in fieldnames})
print(f'✅ leads_unificado.csv salvo com {len(resultados)} contatos (todos com email + wpp quando disponível)')

# Amostra
print('\n📋 Amostra leads WhatsApp:')
for r in com_wpp[:10]:
    print(f'  {r["nome"]}: {r["whatsapp"]}')

print(f'\n📊 Resumo:')
print(f'  Total leads: {len(resultados)}')
print(f'  Com WhatsApp: {len(com_wpp)}')
print(f'  Sem WhatsApp: {len(sem_wpp)}')
