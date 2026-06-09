"""Reset total e disparo em lote — zera status e envia Dia 1 + Onboarding Dia 1 pra todos"""
import json, os, time, urllib.request, urllib.error, glob, sys
from datetime import datetime, timezone

STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'
BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
CAMPANHA_26 = os.path.join(BASE_DIR, 'campanha-26-dias')
CAMPANHA_ONB = os.path.join(BASE_DIR, 'campanha-onboarding')
FUNCTION_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"

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

def enviar(email, nome, template_path, subject):
    if not os.path.exists(template_path):
        return {'success': False, 'error': f'Template nao encontrado: {template_path}'}
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace('{{nome_empresa}}', nome).replace('{{CONTACT_ID}}', nome[:8])
    
    payload = json.dumps({
        'subject': f'{subject} — Meta Construtor',
        'html': html,
        'from': 'Meta Construtor <contato@metaconstrutor.app.br>',
        'emails': [{'to': email, 'nome_empresa': nome}]
    }).encode('utf-8')
    
    req = urllib.request.Request(FUNCTION_URL, data=payload,
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=45)
        return {'success': True, 'data': json.loads(resp.read().decode())}
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
    """Carrega contatos do CSV"""
    csv_path = os.path.join(BASE_DIR, 'contatos_master.csv')
    contatos = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    header = [h.strip().lower() for h in lines[0].strip().split(',')]
    
    email_col = next((i for i, h in enumerate(header) if 'email' in h), None)
    nome_col = next((i for i, h in enumerate(header) if 'nome' in h or 'empresa' in h or 'razao' in h), None)
    
    if email_col is None:
        print(f'❌ Coluna de email nao encontrada. Header: {header}')
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
    """Reseta todos os status pra começar do zero"""
    hoje = datetime.now(timezone.utc).isoformat()
    criados = 0
    for c in contatos:
        email = c['email']
        existing = ler_status(email)
        if existing:
            # Resetar
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
            # Criar novo
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
    """Dispara Dia 1 da campanha 26 + Onboarding Dia 1 pra quem precisa"""
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
    
    print(f'📋 Total de leads no status: {len(todos)}')
    
    # Selecionar quem precisa de Dia 1 da campanha 26 ou Onboarding Dia 1
    elegiveis = []
    for s in todos:
        precisa_26 = s.get('proximo_dia_26', 1) == 1 and not s.get('campanha_26', {}).get('1', {}).get('status') == 'enviado'
        precisa_onb = s.get('indice_onb', 0) == 0 and not s.get('onboarding', {}).get('1', {}).get('status') == 'enviado'
        if precisa_26 or precisa_onb:
            elegiveis.append((s, precisa_26, precisa_onb))
    
    # Ordenar: quem nunca recebeu nada primeiro
    elegiveis.sort(key=lambda x: (
        0 if not x[0].get('campanha_26', {}) else 1,
        0 if not x[0].get('onboarding', {}) else 1,
    ))
    
    print(f'🎯 Leads pra enviar hoje: {len(elegiveis)}')
    
    # Calcular quantos cabem no limite (2 emails cada)
    emails_por_lead = 2
    leads_cabem = min(len(elegiveis), limite // emails_por_lead)
    lote = elegiveis[:leads_cabem]
    
    print(f'🎯 Leads neste lote: {len(lote)} ({len(lote) * emails_por_lead} emails)')
    print()
    
    enviados_26 = 0
    enviados_onb = 0
    erros_26 = 0
    erros_onb = 0
    
    for i, (s, precisa_26, precisa_onb) in enumerate(lote):
        email = s['email']
        nome = s['nome']
        resultados = []
        
        # Dia 1 - Campanha 26
        if precisa_26:
            template = obter_template_26(1)
            if template:
                r = enviar(email, nome, template, crono_26[0]['subject'])
                if r['success']:
                    s.setdefault('campanha_26', {})['1'] = {'status': 'enviado', 'data': data_hoje}
                    s['contador_26'] = 1
                    s['proximo_dia_26'] = 2
                    enviados_26 += 1
                    resultados.append(f'26[D1]✅')
                else:
                    s.setdefault('campanha_26', {})['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                    erros_26 += 1
                    resultados.append(f'26[D1]❌')
        
        # Dia 1 - Onboarding
        if precisa_onb:
            template = obter_template_onb(0)
            if template:
                r = enviar(email, nome, template, crono_onb[0]['subject'])
                if r['success']:
                    s.setdefault('onboarding', {})['1'] = {'status': 'enviado', 'data': data_hoje}
                    s['contador_onb'] = 1
                    s['indice_onb'] = 1
                    enviados_onb += 1
                    resultados.append(f'Onb[D1]✅')
                else:
                    s.setdefault('onboarding', {})['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                    erros_onb += 1
                    resultados.append(f'Onb[D1]❌')
        
        s['ultimo_envio'] = hoje.isoformat()
        salvar_status(s)
        
        status_str = ' '.join(resultados) if resultados else '(nada)'
        print(f'  ({i+1}/{len(lote)}) {nome[:30]:30s} <{email[:25]:25s}> {status_str}')
        time.sleep(0.5)
    
    print(f'\n📊 RESULTADO DO LOTE {data_hoje}:')
    print(f'  ✅ Campanha 26 Dia 1: {enviados_26}')
    print(f'  ✅ Onboarding Dia 1: {enviados_onb}')
    print(f'  ❌ Erros 26: {erros_26}')
    print(f'  ❌ Erros Onb: {erros_onb}')
    print(f'  📊 Total leads: {len(lote)}')
    print(f'  📋 Total emails: {enviados_26 + enviados_onb}')
    
    return enviados_26 + enviados_onb, erros_26 + erros_onb, len(lote)

def main():
    if '--reset' in sys.argv:
        contatos = carregar_contatos()
        print(f'📋 Carregados {len(contatos)} contatos do CSV')
        total = resetar_e_criar_status(contatos)
        print(f'✅ {total} status resetados/criados')
        print()
    
    if '--disparar' in sys.argv or '--reset' in sys.argv:
        limite_idx = sys.argv.index('--limite') + 1 if '--limite' in sys.argv else None
        limite = int(sys.argv[limite_idx]) if limite_idx else 700
        disparar_lote(limite=limite)

if __name__ == '__main__':
    main()
