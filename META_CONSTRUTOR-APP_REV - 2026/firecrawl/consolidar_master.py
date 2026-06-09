import json

# 1. Carrega base NOVA (107 emails de hoje)
with open('.firecrawl/leads/base-consolidada.json', encoding='utf-8') as f:
    base_nova = json.load(f)

# 2. Parse da base ANTIGA (emails_prospeccao.txt - prospecções passadas)
with open('emails_prospeccao.txt', encoding='utf-8') as f:
    content = f.read()

leads_antigos = []
current_empresa = None
current_email = None
current_origem = None

for line in content.strip().split('\n'):
    line = line.strip()
    if not line:
        continue
    
    # Linha com nome de empresa (entre aspas) ou com "Origem:" ou "Email:"
    if line.startswith('"'):
        # Formato: "Nome Empresa" 
        current_empresa = line.strip('"').strip()
    elif line.lower().startswith('email:'):
        current_email = line.split(':', 1)[1].strip()
    elif line.lower().startswith('origem:'):
        current_origem = line.split(':', 1)[1].strip()
        # Quando tem origem, finaliza o lead
        if current_email and current_empresa:
            leads_antigos.append({
                'name': current_empresa,
                'city': '',
                'uf': '',
                'email': current_email.lower(),
                'source': current_origem,
                'type': 'construtora'
            })
        current_empresa = None
        current_email = None
        current_origem = None
    elif '@' in line and not line.startswith('Origem') and not line.startswith('Email'):
        # Linha com email solto
        leads_antigos.append({
            'name': current_empresa or 'Desconhecida',
            'city': '',
            'uf': '',
            'email': line.lower(),
            'source': current_origem or 'Base antiga',
            'type': 'construtora'
        })
        current_empresa = None

# 3. Email extra do Sinduscon-BA
lead_sinduscon_ba = {
    'name': 'Sinduscon-BA (contato)',
    'city': 'Salvador',
    'uf': 'BA',
    'email': 'atendimento@sinduscon-ba.com.br',
    'source': 'Sinduscon-BA',
    'type': 'construtora'
}

# 4. UNIFICAR - dedup por email
all_leads = base_nova + leads_antigos + [lead_sinduscon_ba]

seen = set()
master = []
dup_log = []

for l in all_leads:
    key = l['email']
    if key in seen:
        dup_log.append(key)
        continue
    seen.add(key)
    master.append(l)

# 5. Salvar master
with open('.firecrawl/leads/leads-master.json', 'w', encoding='utf-8') as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

# 6. Estatísticas
from collections import Counter

ufs = Counter(l['uf'] for l in master if l['uf'])
tipos = Counter(l['type'] for l in master)
fontes = Counter(l['source'] for l in master if l['source'])

print(f"=== BASE MASTER CONSOLIDADA ===")
print(f"Total de leads únicos: {len(master)}")
print(f"Total de leads antigos: {len(leads_antigos)}")
print(f"Total de leads novos (hoje): {len(base_nova)}")
print(f"Duplicatas removidas: {len(dup_log)}")
print(f"Duplicatas (emails): {dup_log}")
print(f"\nPor UF:")
for uf, count in ufs.most_common():
    print(f"  {uf or 'N/I'}: {count}")
print(f"\nPor tipo:")
for t, count in tipos.most_common():
    print(f"  {t}: {count}")
print(f"\nPor fonte:")
for f, count in fontes.most_common():
    print(f"  {f}: {count}")

print(f"\nArquivo salvo: .firecrawl/leads/leads-master.json")
