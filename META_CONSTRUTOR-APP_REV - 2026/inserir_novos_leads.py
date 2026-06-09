"""
ESTRATÉGIA DE ONBOARDING GRADUAL PARA 160 NOVOS LEADS
=====================================================
Resend free tier: 100 emails/dia, 2/segundo

Cada lead novo precisa de: 26 (campanha) + 8 (onboarding) = 34 emails
Total: 160 × 34 = 5.440 emails

Não dá pra fazer tudo de uma vez. Estratégia:
- Fase 1: Inserir todos no CSV mestre (segundos)
- Fase 2: Disparar onboarding COMPLETO para os primeiros 50 leads
         (50 × 1 email = 50 disparos)

Depois disso, o cronjob horário existente (onboard_novo_lead.py --processar)
vai detectar os leads restantes automaticamente e processá-los.
"""

import csv, os, sys, time, json
from datetime import datetime

PROJ_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
PROSPECCAO_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO'
LEADS_CSV = os.path.join(PROJ_DIR, 'leads_teste_com_email.csv')
MASTER_CSV = os.path.join(PROSPECCAO_DIR, 'contatos_master.csv')

sys.path.insert(0, PROJ_DIR)
import onboard_novo_lead as ob

# 1. Carregar novos leads
novos = []
with open(LEADS_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = row.get('email', '').strip().lower()
        if email:
            novos.append({
                'nome': row.get('nome', '').strip(),
                'email': email,
                'site': row.get('site', '').strip(),
                'estado': row.get('estado', '').strip(),
                'cidade': row.get('cidade', '').strip(),
            })

print(f'📋 Total leads novos: {len(novos)}')

# 2. Carregar existentes
existentes = set()
with open(MASTER_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        e = row.get('email', '').strip().lower()
        if e:
            existentes.add(e)

realmente_novos = [n for n in novos if n['email'] not in existentes]
print(f'✨ Realmente novos (nao duplicados): {len(realmente_novos)}')

if not realmente_novos:
    print('✅ Nenhum lead novo.')
    sys.exit(0)

# Quantos vamos processar AGORA (Resend: ~50/dia disponivel)
QTD_HOJE = min(3, len(realmente_novos))

# 3. Adicionar TODOS ao CSV mestre (mesmo os que vao ser processados depois)
with open(MASTER_CSV, 'a', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    for n in realmente_novos:
        writer.writerow([n['nome'], n['site'], n['email'], n['cidade'], n['estado']])

print(f'✅ Todos {len(realmente_novos)} adicionados ao contatos_master.csv')

# 4. Processar APENAS os primeiros QTD_HOJE agora
print(f'\n🚀 Processando {QTD_HOJE} leads HOJE (respeitando Resend free tier)')
print(f'   Os outros {len(realmente_novos) - QTD_HOJE} serao processados pelos cronjobs\n')

for i in range(QTD_HOJE):
    lead = realmente_novos[i]
    print(f'\n[{i+1}/{QTD_HOJE}] {lead["nome"]} <{lead["email"]}> ({lead["estado"]})')
    try:
        sucessos, falhas = ob.processar_novo_lead(lead['nome'], lead['email'])
        print(f'   → {sucessos} enviados ✅ / {falhas} falhas ❌')
    except Exception as e:
        print(f'   ❌ ERRO: {e}')
    
    if i < QTD_HOJE - 1:
        print(f'   ⏱️ Aguardando 3s...')
        time.sleep(3)

# 5. Atualizar hash (pra outros leads serem detectados depois)
ob.atualizar_hash()

print(f'\n{"="*50}')
print(f'✅ FASE 1 COMPLETA')
print(f'   - {len(realmente_novos)} leads inseridos no CSV mestre')
print(f'   - {QTD_HOJE} leads receberam onboarding COMPLETO hoje')
print(f'   - Restantes: serao detectados pelo cronjob horário')
print(f'{"="*50}')
print(f'\n📅 Proxima etapa:')
print(f'   1. O cronjob existente roda a cada hora e detecta novos leads')
print(f'   2. Roda: onboard_novo_lead.py --processar (manual)')
print(f'   3. Ou: onboard_novo_lead.py --fila')
