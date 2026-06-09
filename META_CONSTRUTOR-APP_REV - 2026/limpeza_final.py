"""Limpeza final: remover lixo de scraping e duplicatas do contatos_master.csv"""

import csv, re

MASTER_CSV = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'

# Lista de dominios/padroes de lixo de scraping
LIJO_DOMINIOS = [
    'core-js', 'bootstrap', 'swiper', 'slick-carousel', 'js-cookie', 
    'boosters', 'aos', 'maska', 'focus-visible', 'focus-within',
    'alpinejs', 'chart.js', 'dayjs', 'imask', 'inputmask', 'lazysizes', 
    'lodash', 'moment', 'nouislider', 'owl.carousel', 'parallax', 'plyr',
    'popperjs', 'rellax', 'scrollreveal', 'smoothscroll', 'splide',
    'swup', 'typed.js', 'vanilla-tilt', 'vivus', 'waypoints',
    'wow.js', 'wowjs', 'xzoom', 'yall.js', 'zoom.js',
    'sentry-next', 'wixpress',
    '0.0.0.0', 'localhost',
]

def email_limpo(email):
    if not email or not email.strip():
        return False
    email = email.strip().lower()
    if '@' not in email:
        return False
    dominio = email.split('@')[1]
    for l in LIJO_DOMINIOS:
        if l in dominio:
            return False
    return True

# Carregar e limpar
with open(MASTER_CSV, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

fieldnames = reader.fieldnames or ['nome', 'site', 'email', 'telefone', 'estado', 'cidade', 'origem']

limpos = []
removidos_lixo = 0
removidos_duplicata = 0
emails_vistos = set()

for row in data:
    email_raw = row.get('email', '').strip()
    
    # Remover lixo de scraping
    if email_raw and not email_limpo(email_raw):
        removidos_lixo += 1
        row['email'] = ''  # limpa o email, mantém o resto
        limpos.append(row)
        continue
    
    # Remover duplicatas de email valido
    if email_raw and email_limpo(email_raw):
        email = email_raw.lower()
        if email in emails_vistos:
            removidos_duplicata += 1
            row['email'] = ''
            limpos.append(row)
            continue
        emails_vistos.add(email)
    
    limpos.append(row)

with open(MASTER_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(limpos)

print(f'Total original: {len(data)}')
print(f'Lixo de scraping removido: {removidos_lixo}')
print(f'Duplicatas removidas: {removidos_duplicata}')
print(f'Total final: {len(limpos)}')
print(f'Emails unicos validos: {len(emails_vistos)}')

# Recontar status que precisam ser recriados
com_email = sum(1 for r in limpos if email_limpo(r.get('email', '')))
sem_email = sum(1 for r in limpos if not email_limpo(r.get('email', '')))
print(f'Com email valido: {com_email}')
print(f'Sem email: {sem_email}')
