"""Fundir 160 novos leads no contatos_master.csv com telefones WhatsApp"""

import csv, json, re, os, hashlib

MASTER_CSV = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'
LEADS_NOVOS = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\leads_unificado.csv'
LEADS_WPP = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\leads_whatsapp.csv'
OUTPUT_MASTER = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'
OUTPUT_PROJETO = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\contatos_master_atualizado.csv'

# 1. Carregar master existente
existentes = set()
master_data = []
with open(MASTER_CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [fn.replace('\ufeff', '') for fn in reader.fieldnames] if reader.fieldnames else None
    fieldnames = ['nome', 'site', 'email', 'telefone', 'estado', 'cidade', 'origem']
    for row in reader:
        email = row.get('email', '').strip().lower()
        existentes.add(email) if email else None
        master_data.append(row)

print(f'Master existente: {len(master_data)} contatos')
print(f'Emails únicos existentes: {len(existentes)}')

# 2. Carregar novos leads (unificado)
with open(LEADS_NOVOS, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    novos = list(reader)

print(f'Novos leads a adicionar: {len(novos)}')

# 3. Filtrar apenas realmente novos e converter formato
adicionados = 0
pular_ja_existentes = 0
telefone_cache = {}

# Carregar telefone do whatsapp CSV pra cruzar
with open(LEADS_WPP, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        telefone_cache[row['email'].strip().lower()] = row.get('whatsapp', '')

for l in novos:
    email = l.get('email', '').strip().lower()
    if not email:
        continue
    if email in existentes:
        pular_ja_existentes += 1
        continue
    
    telefone = telefone_cache.get(email, l.get('whatsapp', ''))
    
    master_data.append({
        'nome': l.get('nome', 'Lead'),
        'site': l.get('site', ''),
        'email': email,
        'telefone': telefone,
        'estado': l.get('estado', ''),
        'cidade': l.get('cidade', ''),
        'origem': 'prospeccao_inicial_jun2026'
    })
    existentes.add(email)
    adicionados += 1

# 4. Salvar master atualizado
with open(OUTPUT_MASTER, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['nome', 'site', 'email', 'telefone', 'estado', 'cidade', 'origem'])
    writer.writeheader()
    writer.writerows(master_data)

# 5. Copiar pro projeto
import shutil
shutil.copy2(OUTPUT_MASTER, OUTPUT_PROJETO)

print(f'\n📊 RESULTADO:')
print(f'  Total master atualizado: {len(master_data)} contatos')
print(f'  Novos adicionados: {adicionados}')
print(f'  Já existentes (pulados): {pular_ja_existentes}')

# 6. Gerar CSV so de WhatsApp
wpp_data = [m for m in master_data if m.get('telefone', '').strip()]
print(f'  Com WhatsApp: {len(wpp_data)}')

WPP_FINAL = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\leads_whatsapp_final.csv'
with open(WPP_FINAL, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['nome', 'telefone', 'email', 'site', 'estado', 'cidade'])
    writer.writeheader()
    for m in wpp_data:
        writer.writerow({
            'nome': m['nome'],
            'telefone': m['telefone'],
            'email': m['email'],
            'site': m['site'],
            'estado': m['estado'],
            'cidade': m['cidade'],
        })

print(f'  leads_whatsapp_final.csv salvo com {len(wpp_data)} contatos')

# Amostra WhatsApp
print(f'\n📋 Amostra WhatsApp:')
for m in wpp_data[:10]:
    print(f'  {m["nome"]}: {m["telefone"]} ({m["email"]})')
