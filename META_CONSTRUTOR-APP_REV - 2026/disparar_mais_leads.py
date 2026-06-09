"""Disparar onboarding para os próximos leads (respeitando Resend free tier)"""
import sys, time, csv, json, os

PROJ_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
sys.path.insert(0, PROJ_DIR)

import onboard_novo_lead as ob

# Quem já foi processado
ja_processados = set()
import os
for fname in os.listdir(ob.STATUS_DIR):
    if fname.endswith('.json') and not fname.startswith('_'):
        path = os.path.join(ob.STATUS_DIR, fname)
        with open(path) as f:
            data = json.load(f)
            if data.get('campanha_26', {}).get('26', {}).get('status') == 'enviado':
                ja_processados.add(data['email'])

print(f'Já processados: {len(ja_processados)}')

# Carregar contatos do CSV mestre
contatos = ob.carregar_contatos()
nao_processados = [c for c in contatos if c['email'] not in ja_processados]
print(f'Não processados: {len(nao_processados)}')

# Processar mais 2 HOJE
QTD = min(2, len(nao_processados))

for i in range(QTD):
    c = nao_processados[i]
    print(f'\n[{i+1}/{QTD}] {c["nome"]} <{c["email"]}>')
    sucessos, falhas = ob.processar_novo_lead(c['nome'], c['email'])
    print(f'   → {sucessos} enviados ✅ / {falhas} falhas ❌')
    if i < QTD - 1:
        time.sleep(3)

print(f'\n✅ Hoje: 3 leads completos (1 + {QTD})')
print(f'   Restantes: {len(nao_processados) - QTD}')
print(f'   Próxima execução: onboard_novo_lead.py --processar')
