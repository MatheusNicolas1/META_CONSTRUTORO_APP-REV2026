"""Consolidar leads das fontes e exportar leads_teste.csv + contatos_master_atualizado.csv"""
import json, csv, os, hashlib

BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
PROSPECCAO_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO'

# 1. Carregar base existente
base_csv = os.path.join(PROSPECCAO_DIR, 'contatos_master.csv')
existentes_sites = set()
existentes_emails = set()
existentes_leads = []

with open(base_csv, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        site = (row.get('site','') or '').strip().lower()
        email = (row.get('email','') or '').strip().lower()
        if site: existentes_sites.add(site)
        if email: existentes_emails.add(email)
        existentes_leads.append(row)

print(f'Base existente: {len(existentes_leads)} contatos, {len(existentes_emails)} com email')

# 2. Função para extrair lista de um JSON (vários formatos)
def extrair_leads_de_json(caminho):
    if not os.path.exists(caminho):
        return []
    with open(caminho, encoding='utf-8') as f:
        data = json.load(f)
    
    # Tentar varios formatos
    if isinstance(data, list):
        return data
    if 'construtoras' in data:
        return data['construtoras']
    for key in ('leads', 'results', 'data', 'items', 'entries'):
        if key in data and isinstance(data[key], list):
            return data[key]
    # fallback: primeiro valor que seja lista
    for v in data.values():
        if isinstance(v, list):
            return v
    return []

# 3. Carregar fontes
fontes = {
    'construtorasbrasil': os.path.join(BASE_DIR, '.firecrawl', 'prospeccao-inicial', 'construtorasbrasil.json'),
    'profissionais': os.path.join(BASE_DIR, '.firecrawl', 'prospeccao-inicial', 'profissionais.json'),
}

todos_leads = []
vistos = set()

for nome_fonte, caminho in fontes.items():
    raw = extrair_leads_de_json(caminho)
    if not raw:
        print(f'  {nome_fonte}: 0 leads extraidos')
        continue

    for lead in raw:
        nome = lead.get('nome', lead.get('name', '')).strip()
        site = (lead.get('site', lead.get('website', lead.get('site_url', ''))) or '').strip().lower()
        email = (lead.get('email', '') or '').strip().lower()
        estado = (lead.get('estado_sigla', lead.get('estado', lead.get('state', ''))) or '').strip()
        cidade = (lead.get('cidade', lead.get('city', '')) or '').strip()
        telefone = (lead.get('telefone', lead.get('phone', '')) or '').strip()
        
        id_key = site if site else email if email else hashlib.md5(nome.encode()).hexdigest()[:12]
        if id_key in vistos:
            continue
        vistos.add(id_key)
        
        ja_tem_site = site in existentes_sites
        ja_tem_email = email in existentes_emails
        
        todos_leads.append({
            'nome': nome,
            'site': site,
            'email': email,
            'telefone': telefone,
            'estado': estado.upper(),
            'cidade': cidade,
            'fonte': nome_fonte,
            'novo': 'NAO' if (ja_tem_site or ja_tem_email) else 'SIM'
        })
    
    print(f'  {nome_fonte}: {len(raw)} brutos => {sum(1 for l in todos_leads if l["fonte"] == nome_fonte)} apos dedup')

# 4. Estatisticas
print(f'\n=== RESUMO ===')
print(f'Total leads unicos consolidados: {len(todos_leads)}')
print(f'Novos em relacao a base existente: {sum(1 for l in todos_leads if l["novo"] == "SIM")}')
print(f'Com email: {sum(1 for l in todos_leads if l["email"])}')
print(f'Com site: {sum(1 for l in todos_leads if l["site"])}')
print(f'Com telefone: {sum(1 for l in todos_leads if l["telefone"])}')

print(f'\nPor estado:')
estados = {}
for l in todos_leads:
    e = l['estado'] or 'DESC'
    estados[e] = estados.get(e, 0) + 1
for e in sorted(estados.keys()):
    print(f'  {e}: {estados[e]}')

# 5. Exportar leads_teste.csv (só os novos)
novos = [l for l in todos_leads if l['novo'] == 'SIM']
output_csv = os.path.join(BASE_DIR, 'leads_teste.csv')
with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['nome','site','email','telefone','estado','cidade','fonte'])
    writer.writeheader()
    writer.writerows({k: v for k, v in l.items() if k != 'novo'} for l in novos)

print(f'\n✅ leads_teste.csv exportado: {output_csv} ({len(novos)} leads novos)')

# 6. Gerar contatos_master_atualizado.csv
todos_para_master = []
for lead in existentes_leads:
    todos_para_master.append({
        'nome': lead.get('nome',''),
        'site': lead.get('site',''),
        'email': lead.get('email',''),
        'telefone': lead.get('telefone',''),
        'estado': lead.get('estado',''),
        'cidade': lead.get('cidade',''),
        'origem': lead.get('origem','base_original')
    })

for lead in novos:
    todos_para_master.append({
        'nome': lead['nome'],
        'site': lead['site'],
        'email': lead['email'],
        'telefone': lead['telefone'],
        'estado': lead['estado'],
        'cidade': lead['cidade'],
        'origem': f'prospeccao_{lead["fonte"]}'
    })

master_csv = os.path.join(PROSPECCAO_DIR, 'contatos_master_atualizado.csv')
with open(master_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['nome','site','email','telefone','estado','cidade','origem'])
    writer.writeheader()
    writer.writerows(todos_para_master)

print(f'✅ contatos_master_atualizado.csv exportado: {master_csv} ({len(todos_para_master)} contatos)')
print(f'   => Base antiga: {len(existentes_leads)} + Novos: {len(novos)}')
