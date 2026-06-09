"""Gerar lista de empresas com WhatsApp e cadastrar 160 leads no Supabase"""

import json, csv, os, re, hashlib, urllib.request, time

PROJ_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
BATCH_DIR = os.path.join(PROJ_DIR, '.firecrawl', 'prospeccao-inicial')
LEADS_CSV = os.path.join(PROJ_DIR, 'leads_teste_com_email.csv')
WHATSAPP_CSV = os.path.join(PROJ_DIR, 'leads_whatsapp.csv')

SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHZsaHR0eWpldXBycmZ4Z3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjE2NjUsImV4cCI6MjA1OTQzNzY2NX0.KTQx9PG1F81sKEQSCV5CFqzG7DJSRqVoIIyP8V9wQJQ"

# 1. CARREGAR TELEFONES DOS BATCHES
def limpar_telefone(tel):
    """Extrai apenas dígitos do telefone"""
    return re.sub(r'\D', '', tel)

def formatar_whatsapp(tel):
    """Formata telefone para padrão WhatsApp Brasil"""
    dig = limpar_telefone(tel)
    if len(dig) >= 10:
        # Assume 55 Brasil
        if not dig.startswith('55'):
            dig = '55' + dig
        return dig
    return None

# Carregar todos os batches
todos_batches = {}
for fname in ['enriquecidos_batch1.json', 'enriquecidos_batch2.json', 'enriquecidos_batch3.json']:
    path = os.path.join(BATCH_DIR, fname)
    if os.path.exists(path):
        with open(path) as f:
            dados = json.load(f)
        for item in dados:
            site = item.get('site', '').lower().strip()
            telefones_raw = item.get('telefones_encontrados', [])
            if telefones_raw:
                telefones_limpos = []
                for t in telefones_raw[:3]:  # Pega no max 3
                    wpp = formatar_whatsapp(t)
                    if wpp:
                        telefones_limpos.append(wpp)
                if telefones_limpos:
                    todos_batches[site] = telefones_limpos

print(f'Sites com telefone nos batches: {len(todos_batches)}')

# 2. CARREGAR LEADS COM EMAIL E CRUZAR
leads = []
with open(LEADS_CSV, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        leads.append(row)

print(f'Total leads com email: {len(leads)}')

# Cruzar com telefones
leads_com_wpp = []
for l in leads:
    site = l.get('site', '').lower().strip()
    telefones = todos_batches.get(site, [])
    leads_com_wpp.append({
        'nome': l['nome'],
        'email': l['email'],
        'site': l['site'],
        'estado': l['estado'],
        'cidade': l['cidade'],
        'whatsapp': '; '.join(telefones) if telefones else '',
        'telefones_raw': len(telefones)
    })

# 3. GERAR CSV DE WHATSAPP
com_wpp = [l for l in leads_com_wpp if l['whatsapp']]
sem_wpp = [l for l in leads_com_wpp if not l['whatsapp']]

print(f'\n📞 Com WhatsApp: {len(com_wpp)}')
print(f'❌ Sem WhatsApp: {len(sem_wpp)}')

# Salvar CSV de WhatsApp
if com_wpp:
    with open(WHATSAPP_CSV, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['nome', 'whatsapp', 'email', 'site', 'estado', 'cidade']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for l in com_wpp:
            writer.writerow({k: l[k] for k in fieldnames})
    print(f'\n✅ leads_whatsapp.csv gerado com {len(com_wpp)} leads')

# Mostrar amostra
if com_wpp:
    print(f'\n📋 Amostra WhatsApp:')
    for l in com_wpp[:10]:
        print(f'  {l["nome"]}: {l["whatsapp"]}')

# 4. CADASTRAR NO SUPABASE COMO CONTATOS
print(f'\n{"="*50}')
print(f'📧 CADASTRANDO {len(leads)} LEADS NO SUPABASE...')
print(f'{"="*50}')

inseridos = 0
erros = 0

for i, l in enumerate(leads):
    # Gerar UUID-like ID
    seed = l['email'].encode()
    lead_id = hashlib.md5(seed).hexdigest()[:20]
    
    payload = json.dumps({
        "id": lead_id,
        "nome": l['nome'],
        "email": l['email'],
        "site": l.get('site', ''),
        "estado": l.get('estado', ''),
        "cidade": l.get('cidade', ''),
        "fonte": "prospeccao_inicial_jun2026",
        "data_cadastro": "2026-06-08"
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/contatos",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        },
        method="POST"
    )
    
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        inseridos += 1
    except urllib.error.HTTPError as e:
        if e.code == 409:
            inseridos += 1  # Já existe, considerar sucesso
        else:
            erros += 1
            print(f'   ❌ {l["email"]}: HTTP {e.code}')
    except Exception as e:
        erros += 1
        print(f'   ❌ {l["email"]}: {str(e)[:60]}')
    
    if (i+1) % 10 == 0:
        print(f'   ... {i+1}/{len(leads)} processados ({inseridos} inseridos, {erros} erros)')

print(f'\n✅ Cadastro no Supabase concluído!')
print(f'   Inseridos: {inseridos}')
print(f'   Erros: {erros}')
