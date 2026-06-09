"""Limpar emails inválidos/lixo do contatos_master.csv e recriar status"""

import csv, re, os, sys, json, hashlib

MASTER_CSV = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'
STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'

def sanitizar(email):
    return email.replace('@', '_at_').replace('.', '_dot_').replace('-', '_dash_').replace('|', '_pipe_').replace(' ', '_')

def email_valido(email):
    """Verifica se é um email real (não lixo de scraping)"""
    if not email or '@' not in email:
        return False
    local, dominio = email.rsplit('@', 1)
    if '.' not in dominio:
        return False
    # Bloquear dominios de lixo de scraping
    lixo = ['core-js', 'bootstrap', 'swiper', 'slick-carousel', 'js-cookie', 
            'boosters', 'aos', 'jquery', 'maska', 'focus-visible', 'alpinejs',
            'chart.js', 'dayjs', 'imask', 'inputmask', 'lazysizes', 'lodash',
            'moment', 'nouislider', 'owl.carousel', 'parallax', 'plyr',
            'popperjs', 'rellax', 'scrollreveal', 'smoothscroll', 'splide',
            'swup', 'typed.js', 'vanilla-tilt', 'vivus', 'waypoints',
            'wow.js', 'wowjs', 'xzoom', 'yall.js', 'zoom.js']
    for l in lixo:
        if l in dominio:
            return False
    return True

def extrair_emails_limpos(campo):
    """Extrai emails reais de um campo que pode ter multiplos separados por ; ou |"""
    if not campo:
        return []
    # Separar por ; ou |
    partes = re.split(r'[;|]', campo)
    emails = []
    for p in partes:
        p = p.strip()
        if email_valido(p):
            emails.append(p.lower())
    return emails

# 1. Carregar master
with open(MASTER_CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

print(f'Total no master: {len(data)}')

# 2. Limpar e expandir registros com multiplos emails
registros_limpos = []
total_emails = 0
multiemails = 0
lixo_removido = 0

for row in data:
    nome = row.get('nome', '').strip() or 'Empresa'
    tel = row.get('telefone', '').strip()
    site = row.get('site', '').strip()
    estado = row.get('estado', '').strip()
    cidade = row.get('cidade', '').strip()
    origem = row.get('origem', '').strip()
    
    emails = extrair_emails_limpos(row.get('email', ''))
    
    if not emails:
        # Mantem registro sem email
        registros_limpos.append(row)
        continue
    
    # Verificar se tem lixo na string original
    raw = row.get('email', '')
    if '|' in raw:
        lixo_removido += 1
    
    if len(emails) > 1:
        multiemails += 1
    
    for e in emails:
        registros_limpos.append({
            'nome': nome,
            'site': site,
            'email': e,
            'telefone': tel,
            'estado': estado,
            'cidade': cidade,
            'origem': origem,
        })
        total_emails += 1

print(f'  Registros com multiplos emails expandidos: {multiemails}')
print(f'  Registros com lixo de scraping limpos: {lixo_removido}')
print(f'  Total de emails validos apos limpeza: {total_emails}')

# 3. Limpar todos os status existentes
contagem_antes = len(os.listdir(STATUS_DIR)) if os.path.exists(STATUS_DIR) else 0
print(f'  Status existentes antes: {contagem_antes}')

# 4. Recriar status do ZERO (pra garantir consistencia)
import shutil
if os.path.exists(STATUS_DIR):
    for f in os.listdir(STATUS_DIR):
        os.remove(os.path.join(STATUS_DIR, f))
print(f'  Status limpos: {len(os.listdir(STATUS_DIR)) if os.path.exists(STATUS_DIR) else 0}')

# 5. Salvar master limpo
with open(MASTER_CSV, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'site', 'email', 'telefone', 'estado', 'cidade', 'origem']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(registros_limpos)

print(f'  Master salvo: {len(registros_limpos)} registros')

# 6. Recriar status para todos os emails (sem enviar)
import time
os.makedirs(STATUS_DIR, exist_ok=True)
criados = 0
for row in registros_limpos:
    email = row.get('email', '').strip().lower()
    if not email:
        continue
    status_file = os.path.join(STATUS_DIR, f'{sanitizar(email)}.json')
    
    status = {
        'nome': row.get('nome', 'Empresa'),
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

# 7. Atualizar hash
try:
    with open(MASTER_CSV, 'rb') as f:
        content = f.read()
    hash_atual = hashlib.md5(content).hexdigest()
    hash_file = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\.csv_hash'
    with open(hash_file, 'w') as f:
        f.write(hash_atual)
except:
    pass

# 8. Copiar pro projeto
proj_dest = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\contatos_master_atualizado.csv'
shutil.copy2(MASTER_CSV, proj_dest)

print(f'\n✅ RESUMO FINAL:')
print(f'  Total registros: {len(registros_limpos)}')
print(f'  Com email valido: {criados}')
sem_email = sum(1 for r in registros_limpos if not r.get("email","").strip())
print(f'  Sem email: {sem_email}')
print(f'  Status criados: {criados}')
print(f'  -> Todos prontos para campanha!')
