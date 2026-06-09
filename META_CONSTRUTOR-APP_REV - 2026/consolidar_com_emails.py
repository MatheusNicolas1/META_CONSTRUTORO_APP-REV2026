"""Consolidar todos os batches enriquecidos + profissionais.json em um unico CSV de leads com email"""
import json, csv, os, re, hashlib

BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
PROSPECCAO_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO'
FCR_DIR = os.path.join(BASE_DIR, '.firecrawl', 'prospeccao-inicial')

def extrair_json(path):
    """Extrai lista de objetos de um JSON, independente do formato"""
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    for key in ('leads', 'results', 'construtoras', 'data', 'items'):
        if key in data and isinstance(data[key], list):
            return data[key]
    for v in data.values():
        if isinstance(v, list):
            return v
    return []

def normalizar_email(e):
    e = e.strip().lower()
    # Validar formato basico
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', e):
        return None
    # Remover emails invalidos comuns
    if any(x in e for x in ['sentry', 'noreply', 'no-reply', 'donotreply', 'wixpress']):
        return None
    return e

# 1. Carregar base existente
base_csv = os.path.join(PROSPECCAO_DIR, 'contatos_master.csv')
existentes_sites = set()
existentes_emails = set()

with open(base_csv, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        s = (row.get('site','') or '').strip().lower()
        e = (row.get('email','') or '').strip().lower()
        if s: existentes_sites.add(s)
        if e: existentes_emails.add(e)

print(f'Base existente: {len(existentes_emails)} emails, {len(existentes_sites)} sites')

# 2. Carregar construtorasbrasil.json para ter nome/estado/cidade
construtoras = {}
caminho_br = os.path.join(FCR_DIR, 'construtorasbrasil.json')
data = extrair_json(caminho_br)
for c in data:
    site = (c.get('site','') or '').strip().lower()
    if site:
        construtoras[site] = {
            'nome': c.get('nome',''),
            'estado': c.get('estado_sigla', c.get('estado','')),
            'cidade': c.get('cidade','')
        }

print(f'Construtoras no mapa: {len(construtoras)}')

# 3. Processar batches enriquecidos
batches = ['enriquecidos_batch1.json', 'enriquecidos_batch2.json', 'enriquecidos_batch3.json']

todos_leads = {}
vistos_email = set(existentes_emails)

for batch_file in batches:
    caminho = os.path.join(FCR_DIR, batch_file)
    if not os.path.exists(caminho):
        print(f'  {batch_file}: NAO ENCONTRADO')
        continue
    
    dados = extrair_json(caminho)
    encontrados = 0
    
    for registro in dados:
        site = (registro.get('site','') or '').strip().lower().rstrip('/')
        emails_raw = registro.get('emails_encontrados', [])
        if isinstance(emails_raw, str):
            emails_raw = [emails_raw]
        
        # Pegar info da construtora
        info = construtoras.get(site, {})
        nome = info.get('nome', registro.get('nome', ''))
        estado = info.get('estado', registro.get('estado', ''))
        cidade = info.get('cidade', registro.get('cidade', ''))
        
        for e in emails_raw:
            email = normalizar_email(e)
            if not email or email in vistos_email:
                continue
            vistos_email.add(email)
            
            todos_leads[email] = {
                'nome': nome,
                'site': site,
                'email': email,
                'estado': estado,
                'cidade': cidade,
                'fonte': batch_file.replace('.json','')
            }
            encontrados += 1
    
    print(f'  {batch_file}: {encontrados} novos emails encontrados')

# 4. Tambem pegar os profissionais.json que ja tinham email
caminho_prof = os.path.join(FCR_DIR, 'profissionais.json')
prof_dados = extrair_json(caminho_prof)
prof_encontrados = 0

for p in prof_dados:
    email = normalizar_email(p.get('email',''))
    if not email or email in vistos_email:
        continue
    vistos_email.add(email)
    
    site = (p.get('site', p.get('website', '')) or '').strip().lower()
    
    todos_leads[email] = {
        'nome': p.get('nome', p.get('name', '')),
        'site': site,
        'email': email,
        'estado': p.get('estado', p.get('state', '')),
        'cidade': p.get('cidade', p.get('city', '')),
        'fonte': 'profissionais'
    }
    prof_encontrados += 1

print(f'  profissionais.json: {prof_encontrados} novos emails')

# 5. Consolidado final
print(f'\n=== RESUMO FINAL ===')
print(f'Total de novos leads COM EMAIL: {len(todos_leads)}')

estados = {}
for lead in todos_leads.values():
    e = lead['estado'] or 'DESC'
    estados[e] = estados.get(e, 0) + 1

print(f'Distribuicao por estado:')
for e in sorted(estados.keys()):
    print(f'  {e}: {estados[e]}')

# 6. Exportar CSV final
output_csv = os.path.join(BASE_DIR, 'leads_teste_com_email.csv')
with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['nome','site','email','estado','cidade','fonte'])
    writer.writeheader()
    for email in sorted(todos_leads.keys()):
        writer.writerow(todos_leads[email])

print(f'\n✅ CSV exportado: {output_csv}')
print(f'   Total: {len(todos_leads)} leads com email')
print(f'\nExemplo dos primeiros 10:')
for i, (email, lead) in enumerate(sorted(todos_leads.items())[:10]):
    print(f'  {i+1}. {lead["nome"]} <{email}> ({lead["estado"]})')
