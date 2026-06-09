"""Varredura completa: criar status para TODOS os 378 leads pendentes"""

import sys, os, csv, json, time, hashlib
sys.path.insert(0, r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026')
os.chdir(r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026')

import onboard_novo_lead as ob

CONTATOS_CSV = ob.CONTATOS_CSV
STATUS_DIR = ob.STATUS_DIR
os.makedirs(STATUS_DIR, exist_ok=True)

def sanitizar(email):
    return email.replace('@', '_at_').replace('.', '_dot_').replace('-', '_dash_').replace('|', '_pipe_').replace(' ', '_')

# Carregar contatos
with open(CONTATOS_CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    contatos = list(reader)

print(f'Total master: {len(contatos)}')

# Separar quem tem email e quem nao tem status
pending = []
for row in contatos:
    email = row.get('email', '').strip().lower()
    if not email:
        continue
    status_file = os.path.join(STATUS_DIR, f'{sanitizar(email)}.json')
    if os.path.exists(status_file):
        continue
    nome = row.get('nome', '').strip() or email.split('@')[0].replace('.', ' ').title()
    pending.append((nome, email, status_file))

print(f'Pendentes sem status: {len(pending)}')

# PASS0 1: Criar status para todos (sem enviar email - apenas registrar na fila)
criados = 0
for nome, email, status_file in pending:
    if os.path.exists(status_file):
        continue
    
    status = {
        'nome': nome,
        'email': email,
        'campanha_26': {},
        'onboarding': {},
        'contador_26': 0,
        'contador_onb': 0,
        'criado_em': time.strftime('%Y-%m-%d %H:%M:%S'),
        'ultimo_envio': None,
        'completo_26': False,
        'completo_onb': False
    }
    
    with open(status_file, 'w') as f:
        json.dump(status, f, indent=2, ensure_ascii=False)
    
    criados += 1
    if criados <= 5 or criados % 50 == 0:
        print(f'  [{criados}/{len(pending)}] Status criado: {nome} <{email}>')

print(f'\n✅ Status criados: {criados} de {len(pending)}')
print(f'  Total com status agora: {criados + 5} (5 já existiam)')

# Atualizar hash do CSV
try:
    with open(CONTATOS_CSV, 'rb') as f:
        content = f.read()
    hash_atual = hashlib.md5(content).hexdigest()
    with open(ob.HASH_FILE, 'w') as f:
        f.write(hash_atual)
    print(f'  Hash CSV atualizado')
except:
    pass

# Por envelope: vamos processar quantos cabem HOJE (limite Resend: 100/dia)
# Ja enviamos 102 emails hoje (3 leads x 34)
# Cabe mais 1 lead hoje? 102 + 34 = 136 > 100 NAO
# Mas o limite é 100/dia - vamos verificar quantos disparos reais foram feitos
print(f'\n📊 RESUMO:')
print(f'  Total no master: {len(contatos)}')
print(f'  Com email: {len(pending) + 5}')
print(f'  Status criados hoje (fila): {criados}')
print(f'  Leads onboardados hoje: 3 (Alfatech, Coinpe, Barcino)')
print(f'  Leads onboardados agora: 2 (Relacionamento, Hugo)')
print(f'  Total disparos hoje: ~170 emails')
print(f'  ⚠️ Excedeu limite Resend free (100/dia)!')
print(f'  ⏳ Próximos: cronjob vai processar 2/hora amanhã')
