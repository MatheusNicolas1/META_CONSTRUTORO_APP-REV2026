"""Remover lixo de scraping da fila de status"""

import json, os, re

STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'

lixo_patterns = [
    r'.*@\d\.\d+(\.\d+)?$',
    r'.*\.(png|gif|jpg|jpeg|svg|webp)$',
    r'.*boosters-.*',
    r'.*core-js.*', r'.*jquery.*', r'.*polyfill.*',
    r'.*slick@.*', r'.*font-awesome.*',
    r'.*@2x.*', r'.*@3x.*', r'.*@4x.*', r'.*@300x.*', r'.*@150x.*',
]

def eh_lixo(email):
    for p in lixo_patterns:
        if re.match(p, email, re.IGNORECASE):
            return True
    return False

removidos = 0
mantidos = 0

for f in os.listdir(STATUS_DIR):
    if not f.endswith('.json'):
        continue
    path = os.path.join(STATUS_DIR, f)
    with open(path) as fp:
        s = json.load(fp)
    email = s.get('email', '')
    if eh_lixo(email):
        os.remove(path)
        removidos += 1
    else:
        mantidos += 1

print('Limpeza concluida')
print(f'Removidos: {removidos}')
print(f'Mantidos: {mantidos}')
