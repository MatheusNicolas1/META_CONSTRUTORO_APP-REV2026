"""Fundir 160 leads enriquecidos (com email) no contatos_master_atualizado.csv"""

import csv, re, os, shutil

BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO'
PROJ_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
MASTER_ATUAL = os.path.join(BASE_DIR, 'contatos_master_atualizado.csv')
LEADS_UNIF = os.path.join(PROJ_DIR, 'leads_unificado.csv')
LEADS_WPP = os.path.join(PROJ_DIR, 'leads_whatsapp.csv')
OUTPUT_MASTER = os.path.join(BASE_DIR, 'contatos_master.csv')
OUTPUT_PROJ = os.path.join(PROJ_DIR, 'contatos_master_atualizado.csv')

# 1. Carregar master existente (1002)
with open(MASTER_ATUAL, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    existentes_data = list(reader)

existentes_emails = set()
for row in existentes_data:
    e = row.get('email', '').strip().lower()
    if e:
        existentes_emails.add(e)

print(f'Master existente: {len(existentes_data)} contatos')
print(f'Com email: {len(existentes_emails)}')

# 2. Carregar novos leads (160)
with open(LEADS_UNIF, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    novos_leads = list(reader)

# 3. Carregar telefones whatsapp
telefones_wpp = {}
with open(LEADS_WPP, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        e = row.get('email', '').strip().lower()
        if e:
            telefones_wpp[e] = row.get('whatsapp', '')

print(f'Novos leads: {len(novos_leads)}')

# 4. Adicionar apenas realmente novos
adicionados = 0
pulados = 0
for l in novos_leads:
    email = l.get('email', '').strip().lower()
    if not email:
        continue
    if email in existentes_emails:
        pulados += 1
        continue
    
    telefone = telefones_wpp.get(email, l.get('whatsapp', ''))
    
    existentes_data.append({
        'nome': l.get('nome', 'Lead'),
        'site': l.get('site', ''),
        'email': email,
        'telefone': telefone,
        'estado': l.get('estado', ''),
        'cidade': l.get('cidade', ''),
        'origem': 'prospeccao_inicial_jun2026'
    })
    existentes_emails.add(email)
    adicionados += 1

# 5. Salvar master atualizado
with open(OUTPUT_MASTER, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'site', 'email', 'telefone', 'estado', 'cidade', 'origem']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(existentes_data)

# 6. Copiar pro projeto
shutil.copy2(OUTPUT_MASTER, OUTPUT_PROJ)

# 7. Gerar CSV final só WhatsApp
wpp_data = []
for row in existentes_data:
    tel = row.get('telefone', '').strip()
    if tel:
        wpp_data.append({
            'nome': row['nome'],
            'telefone': tel,
            'email': row.get('email', ''),
            'site': row.get('site', ''),
            'estado': row.get('estado', ''),
            'cidade': row.get('cidade', ''),
        })

WPP_FINAL = os.path.join(PROJ_DIR, 'leads_whatsapp_final.csv')
with open(WPP_FINAL, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'telefone', 'email', 'site', 'estado', 'cidade']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(wpp_data)

print(f'\n📊 RESULTADO:')
print(f'  Total master final: {len(existentes_data)} contatos')
print(f'  Novos adicionados: {adicionados}')
print(f'  Já existentes (pulados): {pulados}')
print(f'  Com WhatsApp: {len(wpp_data)}')
print(f'  Sem telefone: {len(existentes_data) - len(wpp_data)}')

print(f'\n📋 Amostra WhatsApp ({min(10, len(wpp_data))}):')
for w in wpp_data[:10]:
    print(f'  {w["nome"]}: {w["telefone"]}')

print('\n📋 Amostra SEM WhatsApp:')
sem = [r for r in existentes_data if not r.get('telefone', '').strip()]
print(f'  ({len(sem)} sem telefone)')
for s in sem[:5]:
    print(f'  {s["nome"]}: {s.get("email","")[:30]}...')
