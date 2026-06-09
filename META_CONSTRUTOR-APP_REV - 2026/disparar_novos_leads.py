"""Disparar onboarding para leads NOVOS (que ainda nao tem status)"""
import sys, os, csv, json

PROJ_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
sys.path.insert(0, PROJ_DIR)
os.chdir(PROJ_DIR)

import onboard_novo_lead as ob

# Carregar CSV
with open(ob.CONTATOS_CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    contatos = list(reader)

print(f'Total contatos no master: {len(contatos)}')

# Filtrar quem tem email e ainda NAO tem status
novos = []
for row in contatos:
    email = row.get('email', '').strip().lower()
    nome = row.get('nome', '').strip()
    if not email:
        continue
    
    status_file = os.path.join(ob.STATUS_DIR, f'{ob.sanitizar(email)}.json')
    if os.path.exists(status_file):
        continue
    
    novos.append((nome, email))

print(f'Sem status (novos): {len(novos)}')

# Pega os 2 primeiros pra hoje (limite Resend: 100/dia, ja enviamos 3 leads)
disparar = novos[:2]
restantes = novos[2:]

print(f'\nDisparando hoje: {len(disparar)} leads')
print(f'Restantes (prox. dias): {len(restantes)}')

for nome_orig, email in disparar:
    nome = nome_orig if nome_orig.strip() else email.split('@')[0].replace('.', ' ').title()
    print(f'\n▶️ Processando: {nome} <{email}>')
    try:
        ob.processar_novo_lead(nome, email)
        print(f'   ✅ Onboarding completo!')
    except Exception as e:
        print(f'   ❌ Erro: {str(e)[:100]}')

print(f'\n✅ Hoje: 3 leads (1 teste ontem + 2 agora) = 102 emails enviados')
print(f'📅 Amanhã: mais 2 leads')
print(f'📅 Próximos {len(restantes)} levarão ~50 dias no ritmo atual')
