"""Disparo imediato respeitando limite Resend — envia Dia 1 pra quantos couber"""

import json, os, time, urllib.request, urllib.error, glob, sys
from datetime import datetime, timezone

STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'
CAMPANHA_26 = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-26-dias'
CAMPANHA_ONB = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-onboarding'
BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
FUNCTION_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
LIMITE_DIARIO = 100

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
    html = html.replace('{{nome_empresa}}', nome)
    
    payload = json.dumps({
        'subject': f'{subject} — Meta Construtor',
        'html': html,
        'emails': [{'to': email, 'nome_empresa': nome}]
    }).encode('utf-8')
    
    req = urllib.request.Request(FUNCTION_URL, data=payload,
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=45)
        return {'success': True, 'data': json.loads(resp.read().decode())}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def carregar_cronograma_26():
    with open(os.path.join(CAMPANHA_26, 'cronograma.json'), encoding='utf-8') as f:
        return json.load(f)

def carregar_cronograma_onb():
    with open(os.path.join(CAMPANHA_ONB, 'cronograma.json'), encoding='utf-8') as f:
        return json.load(f)

def disparar_lote(max_emails=100):
    """Dispara Dia 1 pra quantos leads couberem no limite."""
    crono_26 = carregar_cronograma_26()
    crono_onb = carregar_cronograma_onb()
    
    hoje = datetime.now(timezone.utc)
    data_hoje = hoje.strftime('%Y-%m-%d')
    
    # Carregar todos os status e separar quem ta na fila
    todos_status = []
    for f in os.listdir(STATUS_DIR):
        if not f.endswith('.json'):
            continue
        with open(os.path.join(STATUS_DIR, f)) as fp:
            todos_status.append(json.load(fp))
    
    # Quem ainda nao completou e ta pronto pro dia 1
    na_fila = [s for s in todos_status 
               if not s.get('completo_26', False) 
               and s.get('proximo_dia_26', 1) == 1
               and '1' not in s.get('campanha_26', {})]
    
    total_lote = min(len(na_fila), max_emails // 2)  # 2 emails por lead
    # Na pratica 100/2 = 50 leads
    if max_emails >= 2:
        total_lote = min(len(na_fila), max_emails // 2)
    else:
        total_lote = min(len(na_fila), max_emails)
    
    print(f'📋 Leads prontos pro Dia 1: {len(na_fila)}')
    print(f'🎯 Disparando lote de {total_lote} leads (ate {max_emails} emails)')
    
    enviados = 0
    erros = 0
    
    for i, s in enumerate(na_fila[:total_lote]):
        email = s['email']
        nome = s['nome']
        
        # Enviar campanha 26 - Dia 1
        files = sorted(glob.glob(os.path.join(CAMPANHA_26, 'dia-01-*.html')))
        if files:
            r = enviar(email, nome, files[0], crono_26[0]['subject'])
            if r['success']:
                s['campanha_26']['1'] = {'status': 'enviado', 'data': data_hoje}
                s['contador_26'] = 1
                s['proximo_dia_26'] = 2
                enviados += 1
            else:
                s['campanha_26']['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                erros += 1
                err_msg = r.get('error', '')[:60]
                print(f'  ❌ {nome}: erro campanha26 - {err_msg}')
        else:
            print(f'  ⚠️ {nome}: template dia-01 nao encontrado')
            s['campanha_26']['1'] = {'status': 'pulado', 'motivo': 'template'}
            s['proximo_dia_26'] = 2
        
        # Enviar onboarding - Dia 1
        tp = os.path.join(CAMPANHA_ONB, crono_onb[0]['template'])
        if not os.path.exists(tp):
            tp = os.path.join(BASE_DIR, crono_onb[0]['template'])
        if os.path.exists(tp):
            r = enviar(email, nome, tp, crono_onb[0]['subject'])
            if r['success']:
                s['onboarding']['1'] = {'status': 'enviado', 'data': data_hoje}
                s['contador_onb'] = 1
                s['indice_onb'] = 1
                enviados += 1
            else:
                s['onboarding']['1'] = {'status': 'falhou', 'erro': r.get('error','')}
                erros += 1
                err_msg = r.get('error', '')[:60]
                print(f'  ❌ {nome}: erro onboarding - {err_msg}')
        else:
            print(f'  ⚠️ {nome}: template onboarding nao encontrado: {tp}')
            s['onboarding']['1'] = {'status': 'pulado', 'motivo': 'template'}
            s['indice_onb'] = 1
            s['contador_onb'] = 1
        
        s['ultimo_envio'] = hoje.isoformat()
        salvar_status(s)
        
        print(f'  ✅ ({i+1}/{total_lote}) {nome} <{email}>: 26[1] + Onb[1]')
        time.sleep(0.5)  # Rate limit Resend: 2/s
    
    print(f'\n📊 RESULTADO:')
    print(f'  ✅ Enviados: {enviados}')
    print(f'  ❌ Erros: {erros}')
    print(f'  👥 Leads processados: {total_lote}')
    
    return enviados, erros, total_lote

if __name__ == '__main__':
    import sys
    args = sys.argv[1:]
    
    if '--limite' in args:
        idx = args.index('--limite')
        limite = int(args[idx+1]) if len(args) > idx+1 else LIMITE_DIARIO
    else:
        limite = LIMITE_DIARIO
    
    enviados, erros, leads = disparar_lote(max_emails=limite)
