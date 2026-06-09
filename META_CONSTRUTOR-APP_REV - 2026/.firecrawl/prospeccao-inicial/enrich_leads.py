import json
from collections import Counter

base_dir = 'C:/Users/nicol/OneDrive/Documentos/META CONSTRUTOR/META CONSTRUTOR - APP/META_CONSTRUTOR-APP_REV - 2026/.firecrawl'

# Known construtoras state mapping
known_states = {
    'ri@direcional.com.br': 'MG',
    'contato@mpd.com.br': 'SP',
    'contatos@curyconstrutora.net': 'SP',
    'leonardo.junior@construtorajl.com': 'ES',
    'faleconosco@mouradubeux.com.br': 'PE',
    'atendimento@ayoshii.com.br': 'PR',
    'sac@trisul-sa.com.br': 'SP',
    'atendonlinerecife@cyrela.com.br': 'PE',
    'relacionamento@gafisa.com.br': 'SP',
    'fabiofranco@rossiresidencial.com.br': 'SP',
    'sac@fratta.com.br': 'SP',
    'dpo@remconstrutora.com.br': 'PR',
    'comercial@anson.com.br': 'SP',
    'sac@bencen.com.br': 'SP',
    'azevedo@azevedotravassos.com.br': 'RJ',
    'caio.inbox@cbmsa.com.br': 'MG',
    'diretoria@aparatto.com': 'SC',
    'contato@celi.com.br': 'SP',
    'bfc@grupobfc.com.br': 'SP',
    'atendimento@construtoralusa.com.br': 'SP',
    'contato.nordesteconstrucoes@gmail.com': 'BA',
    'sac@capuche.com.br': 'SP',
    'abcorte@veloxmail.com.br': 'SP',
    'rafaela@agsconstrucao.com.br': 'SP',
    'comerciallmf@lmfconstrucoes.com.br': 'PE',
    'ricardo@argic.com.br': 'SP',
    'dvandrade@gmail.com': 'SP',
    'eduardobandeira@avelozempreendimentos.com.br': 'SP',
    'contato@trioempreendimentos.com': 'SP',
    'financeiro@barbosaepinto.com.br': 'BA',
    'pedrinholima@hotmail.com': 'SP',
    'daniel@ca3construtora.com.br': 'SP',
    'silvia@cabralincorporadora.com.br': 'SP',
    'accruz@accruz.com.br': 'SP',
    'online@construtoradallas.com.br': 'SP',
    'conlar@conlar.com': 'SP',
    'flavia@aclf.com.br': 'SP',
    'recrutamento@perplan.com.br': 'SP',
}

known_cities = {
    'ri@direcional.com.br': 'Belo Horizonte',
    'contato@mpd.com.br': 'São Paulo',
    'contatos@curyconstrutora.net': 'São Paulo',
    'leonardo.junior@construtorajl.com': 'Vitória',
    'faleconosco@mouradubeux.com.br': 'Recife',
    'atendimento@ayoshii.com.br': 'Londrina',
    'sac@trisul-sa.com.br': 'São Paulo',
    'atendonlinerecife@cyrela.com.br': 'Recife',
    'relacionamento@gafisa.com.br': 'São Paulo',
    'fabiofranco@rossiresidencial.com.br': 'São Paulo',
    'sac@fratta.com.br': 'São Paulo',
    'dpo@remconstrutora.com.br': 'Curitiba',
    'comercial@anson.com.br': 'São Paulo',
    'sac@bencen.com.br': 'São Paulo',
    'azevedo@azevedotravassos.com.br': 'Rio de Janeiro',
    'caio.inbox@cbmsa.com.br': 'Belo Horizonte',
    'diretoria@aparatto.com': 'Chapecó',
    'contato@celi.com.br': 'São Paulo',
    'bfc@grupobfc.com.br': 'São Paulo',
    'atendimento@construtoralusa.com.br': 'São Paulo',
    'contato.nordesteconstrucoes@gmail.com': 'Salvador',
    'sac@capuche.com.br': 'São Paulo',
    'abcorte@veloxmail.com.br': 'São Paulo',
    'rafaela@agsconstrucao.com.br': 'São Paulo',
    'comerciallmf@lmfconstrucoes.com.br': 'Recife',
    'ricardo@argic.com.br': 'São Paulo',
    'dvandrade@gmail.com': 'São Paulo',
    'eduardobandeira@avelozempreendimentos.com.br': 'São Paulo',
    'contato@trioempreendimentos.com': 'São Paulo',
    'financeiro@barbosaepinto.com.br': 'Salvador',
    'pedrinholima@hotmail.com': 'São Paulo',
    'daniel@ca3construtora.com.br': 'São Paulo',
    'silvia@cabralincorporadora.com.br': 'São Paulo',
    'accruz@accruz.com.br': 'São Paulo',
    'online@construtoradallas.com.br': 'São Paulo',
    'conlar@conlar.com': 'São Paulo',
    'flavia@aclf.com.br': 'São Paulo',
    'recrutamento@perplan.com.br': 'São Paulo',
}

# Load existing leads
with open(base_dir + '/leads/leads-master.json', 'r') as f:
    all_leads = json.load(f)

# Enrich the Base antiga items
for item in all_leads:
    if item.get('source') == 'Base antiga':
        email_raw = item['email']
        email_clean = email_raw.split('#')[0].strip().replace('\ufeff', '')
        item['email'] = email_clean
        if email_clean in known_states:
            item['uf'] = known_states[email_clean]
            item['city'] = known_cities.get(email_clean, '')

print(f'Total leads: {len(all_leads)}')
states = Counter(item.get('uf', '') for item in all_leads)
for s in sorted(states.keys()):
    print(f'  {s if s else "SEM_UF"}: {states[s]}')

total_with_email = sum(1 for item in all_leads if item.get('email'))
total_with_phone = sum(1 for item in all_leads if item.get('phone') or item.get('phones') or item.get('telefone'))
total_with_site = sum(1 for item in all_leads if item.get('url') or item.get('site'))

print(f'Total com email: {total_with_email}')
print(f'Total com telefone: {total_with_phone}')
print(f'Total com site: {total_with_site}')
