"""Gerar lista limpa de empresas com WhatsApp válido + iniciar campanhas"""

import csv, re, os

MASTER_PATH = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'
OUTPUT_PATH = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\leads_whatsapp_contato.csv'

def validar_whatsapp(tel):
    """Valida se telefone tem formato WhatsApp Brasil válido"""
    # Pega apenas dígitos
    dig = re.sub(r'\D', '', tel)
    # Remove 55 se tiver
    if dig.startswith('55') and len(dig) >= 12:
        dig = dig[2:]
    # Brasil: 10-11 dígitos (DDD 2 + número 8-9)
    if len(dig) in [10, 11]:
        return f'55{dig}'
    # Se já veio com 55 e tem 12-13 dígitos
    if len(dig) in [12, 13]:
        return dig
    return None

with open(MASTER_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

print(f'Total no master: {len(data)}')

whatsapp_valido = []
com_telefone_mas_invalido = 0
sem_telefone = 0

for row in data:
    nome = row.get('nome', '').strip() or 'Empresa'
    tel_raw = row.get('telefone', '').strip()
    email = row.get('email', '').strip()
    site = row.get('site', '').strip()
    
    if not tel_raw:
        sem_telefone += 1
        continue
    
    # Pega o primeiro telefone (separados por ;)
    primeiro_tel = tel_raw.split(';')[0].strip()
    tel_valido = validar_whatsapp(primeiro_tel)
    
    if tel_valido:
        whatsapp_valido.append({
            'nome': nome,
            'whatsapp': tel_valido,
            'email': email,
            'site': site,
            'estado': row.get('estado', ''),
            'cidade': row.get('cidade', ''),
        })
    else:
        com_telefone_mas_invalido += 1

# Salvar CSV WhatsApp válido
with open(OUTPUT_PATH, 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['nome', 'whatsapp', 'email', 'site', 'estado', 'cidade']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(whatsapp_valido)

print(f'\n📊 RESULTADO WHATSAPP:')
print(f'  WhatsApp válido para contato: {len(whatsapp_valido)}')
print(f'  Com telefone mas inválido: {com_telefone_mas_invalido}')
print(f'  Sem telefone: {sem_telefone}')

print(f'\n📋 Amostra ({min(10, len(whatsapp_valido))}):')
for w in whatsapp_valido[:10]:
    print(f'  {w["nome"]}: +{w["whatsapp"]} | {w["email"][:30]}')

print(f'\n✅ leads_whatsapp_contato.csv salvo com {len(whatsapp_valido)} contatos')
