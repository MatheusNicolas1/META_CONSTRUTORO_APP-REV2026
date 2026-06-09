"""Disparo direto via API Resend — contorna DNS do Supabase"""
import json, os, time, urllib.request, urllib.error, glob, sys, ssl
from datetime import datetime, timezone

STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'
BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
CAMPANHA_26 = os.path.join(BASE_DIR, 'campanha-26-dias')
CAMPANHA_ONB = os.path.join(BASE_DIR, 'campanha-onboarding')

RESEND_API_KEY = "***"
FROM_EMAIL = "Meta Construtor <contato@metaconstrutor.app.br>"

os.makedirs(STATUS_DIR, exist_ok=True)

def sanitizar(email):
    return email.replace('@','_at_').replace('.','_dot_').replace('-','_dash_').replace('|','_pipe_').replace(' ','_')

def status_path(email):
    return os.path.join(STATUS_DIR, f'{sanitizar(email)}.json')

def ler_status(email):
    p = status_path(email)
    if os.path.exists(p):
        with open(p) as f:
            return json.load(f)
    return None

def salvar_status(data):
    with open(status_path(data['email']), 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def enviar_resend(email, nome, html, subject):
    """Envia email direto pela API Resend (sem passar pela EF)"""
    payload = json.dumps({
        'from': FROM_EMAIL,
        'to': [email],
        'subject': subject,
        'html': html
    }).encode('utf-8')
    
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={
            'Authorization': f'Bearer {RESEND_API_KEY}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    ctx = ssl.create_default_context()
    try:
        resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        data = json.loads(resp.read().decode())
        return {'success': True, 'id': data.get('id')}
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        return {'success': False, 'error': f'HTTP {e.code}: {body}'}
    except Exception as e:
        return {'success': False, 'error': str(e)[:200]}

def carregar_cronograma_26():
    with open(os.path.join(CAMPANHA_26, 'cronograma.json'), encoding='utf-8') as f:
        return json.load(f)

def carregar_cronograma_onb():
    with open(os.path.join(CAMPANHA_ONB, 'cronograma.json'), encoding='utf-8') as f:
        return json.load(f)

def obter_template_26(dia_numero):
    files = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero:02d}-*.html')))
    if files:
        return files[0]
    alt = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero}-*.html')))
    if alt:
        return alt[0]
    return None

def obter_template_onb(indice):
    crono = carregar_cronograma_onb()
    if indice >= len(crono):
        return None
    tp = os.path.join(CAMPANHA_ONB, crono[indice]['template'])
    if os.path.exists(tp):
        return tp
    return None

def carregar_contatos():
    csv_path = os.path.join(BASE_DIR, 'contatos_master.csv')
    contatos = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    header = [h.strip().lower() for h in lines[0].strip().split(',')]
    email_col = next((i for i, h in enumerate(header) if 'email' in h), None)
    nome_col = next((i for i, h in enumerate(header) if 'nome' in h or 'empresa' in h or 'razao' in h), None)
    if email_col is None:
        print(f'❌ Coluna email não encontrada. Header: {header}')
        return []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split(',')
        if email_col >= len(parts):
            continue
        email = parts[email_col].strip().lower()
        if not email or '@' not in email:
            continue
        nome = parts[nome_col].strip() if nome_col is not None and nome_col < len(parts) else email.split('@')[0]
        contatos.append({'email': email, 'nome': nome})
    return contatos

def resetar_e_criar_status(contatos):
    hoje = datetime.now(timezone.utc).isoformat()
    criados = 0
    for c in contatos:
        email = c['email']
        existing = ler_status(email)
        if existing:
            existing['proximo_dia_26'] = 1
            existing['indice_onb'] = 0
            existing['contador_26'] = 0
            existing['contador_onb'] = 0
            existing['campanha_26'] = {}
            existing['onboarding'] = {}
            existing['completo_26'] = False
            existing['completo_onb'] = False
            existing['ultimo_reset'] = hoje
            if 'data_inicio' not in existing:
                existing['data_inicio'] = hoje
            salvar_status(existing)
        else:
            s = {
                'email': email,
                'nome': c['nome'],
                'data_inicio': hoje,
                'criado_em': hoje,
                'proximo_dia_26': 1,
                'indice_onb': 0,
                'contador_26': 0,
                'contador_onb': 0,
                'campanha_26': {},
                'onboarding': {},
                'completo_26': False,
                'completo_onb': False,
                'ultimo_reset': hoje,
            }
            salvar_status(s)
        criados += 1
    return criados

def disparar_lote(limite=700):
    crono_26 = carregar_cronograma_26()
    crono_onb = carregar_cronograma_onb()
    hoje = datetime.now(timezone.utc)
    data_hoje = hoje.strftime('%Y-%m-%d')
    
    todos = []
    for f in os.listdir(STATUS_DIR):
        if not f.endswith('.json'):
            continue
        with open(os.path.join(STATUS_DIR, f)) as fp:
            todos.append(json.load(fp))
    
    print(f'📋 Total de leads: {len(todos)}')
    
    elegiveis = []
    for s in todos:
        precisa_26 = s.get('proximo_dia_26', 1) == 1 and s.get('campanha_26', {}).get('1', {}).get('status') != 'enviado'
        precisa_onb = s.get('indice_onb', 0) == 0 and s.get('onboarding', {}).get('1', {}).get('status') != 'enviado'
        if precisa_26 or precisa_onb:
            elegiveis.append((s, precisa_26, precisa_onb))
    
    elegiveis.sort(key=lambda x: (0 if not x[0].get('campanha_26', {}) else 1, 0 if not x[0].get('onboarding', {}) else 1))
    
    print(f'🎯 Leads elegíveis: {len(elegiveis)}')
    
    # 2 emails por lead
    leads_cabem = min(len(elegiveis), limite // 2)
    lote = elegiveis[:leads_cabem]
    
    print(f'🎯 Leads neste lote: {len(lote)} ({len(lote) * 2} emails)')
    print()
    
    enviados_26 = 0
    enviados_onb = 0
    erros_26 = 0
    erros_onb = 0
    enviados_ids = []
    
    for i, (s, precisa_26, precisa_onb) in enumerate(lote):
        email = s['email']
        nome = s['nome']
        resultados = []
        
        # Campanha 26 - Dia 1
        if precisa_26:
            template = obter_template_26(1)
            if template:
                with open(template, 'r', encoding='utf-8') as f:
                    html = f.read()
                html = html.replace('{{nome_empresa}}', nome).replace('{{CONTACT_ID}}', nome[:8])
                r = enviar_resend(email, nome, html, f'{crono_26[0]["subject"]} — Meta Construtor')
                if r['success']:
                    s.setdefault('campanha_26', {})['1'] = {'status': 'enviado', 'data': data_hoje, 'id': r.get('id')}
                    s['contador_26'] = 1
                    s['proximo_dia_26'] = 2
                    enviados_26 += 1
                    enviados_ids.append(r.get('id'))
                    resultados.append(f'26[D1]✅')
                else:
                    s.setdefault('campanha_26', {})['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                    erros_26 += 1
                    resultados.append(f'26[D1]❌')
        
        # Onboarding - Dia 1
        if precisa_onb:
            template = obter_template_onb(0)
            if template:
                with open(template, 'r', encoding='utf-8') as f:
                    html = f.read()
                html = html.replace('{{nome_empresa}}', nome).replace('{{CONTACT_ID}}', nome[:8])
                r = enviar_resend(email, nome, html, f'{crono_onb[0]["subject"]} — Meta Construtor')
                if r['success']:
                    s.setdefault('onboarding', {})['1'] = {'status': 'enviado', 'data': data_hoje, 'id': r.get('id')}
                    s['contador_onb'] = 1
                    s['indice_onb'] = 1
                    enviados_onb += 1
                    enviados_ids.append(r.get('id'))
                    resultados.append(f'Onb[D1]✅')
                else:
                    s.setdefault('onboarding', {})['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                    erros_onb += 1
                    resultados.append(f'Onb[D1]❌')
        
        s['ultimo_envio'] = hoje.isoformat()
        salvar_status(s)
        
        status_str = ' '.join(resultados) if resultados else '(nada)'
        print(f'  ({i+1}/{len(lote)}) {nome[:30]:30s} <{email[:25]:25s}> {status_str}')
        time.sleep(0.5)  # 0.5s entre leads = ~3min pra 345 leads
    
    print(f'\n📊 RESULTADO:')
    print(f'  ✅ Campanha 26: {enviados_26}')
    print(f'  ✅ Onboarding: {enviados_onb}')
    print(f'  ❌ Erros 26: {erros_26}')
    print(f'  ❌ Erros Onb: {erros_onb}')
    print(f'  📊 Total leads: {len(lote)}')
    print(f'  📋 Total emails: {enviados_26 + enviados_onb}')
    
    return enviados_26 + enviados_onb, erros_26 + erros_onb, len(lote)

if __name__ == '__main__':
    import sys
    if '--reset' in sys.argv:
        contatos = carregar_contatos()
        print(f'📋 Carregados {len(contatos)} contatos')
        total = resetar_e_criar_status(contatos)
        print(f'✅ {total} status resetados')
        print()
    
    if '--disparar' in sys.argv or '--reset' in sys.argv:
        limite_idx = sys.argv.index('--limite') + 1 if '--limite' in sys.argv else None
        limite = int(sys.argv[limite_idx]) if limite_idx else 700
        disparar_lote(limite=limite)
