"""Processador diário universal — envia o email certo pra cada lead no dia certo"""

import json, os, time, urllib.request, urllib.error, glob, sys
from datetime import datetime, timezone

STATUS_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\status_individual'
BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
CAMPANHA_26 = os.path.join(BASE_DIR, 'campanha-26-dias')
CAMPANHA_ONB = os.path.join(BASE_DIR, 'campanha-onboarding')
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
        body = e.read().decode()[:200]
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
    """Encontra o template HTML pro dia especifico da campanha 26."""
    files = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero:02d}-*.html')))
    if files:
        return files[0]
    # Fallback: buscar por numero no nome
    alt = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero}-*.html')))
    if alt:
        return alt[0]
    return None

def obter_template_onb(indice):
    """Encontra o template onboarding pelo indice no cronograma."""
    crono = carregar_cronograma_onb()
    if indice >= len(crono):
        return None
    tp = os.path.join(CAMPANHA_ONB, crono[indice]['template'])
    if os.path.exists(tp):
        return tp
    tp2 = os.path.join(BASE_DIR, crono[indice]['template'])
    if os.path.exists(tp2):
        return tp2
    return None

def processar_diario(max_emails=100):
    """Processa 1 dia de cada lead: envia o proximo email de cada campanha."""
    crono_26 = carregar_cronograma_26()
    crono_onb = carregar_cronograma_onb()
    
    hoje = datetime.now(timezone.utc)
    data_hoje = hoje.strftime('%Y-%m-%d')
    
    # Carregar todos os status
    todos = []
    for f in os.listdir(STATUS_DIR):
        if not f.endswith('.json'):
            continue
        with open(os.path.join(STATUS_DIR, f)) as fp:
            todos.append(json.load(fp))
    
    # Quem ta pronto pra receber email HOJE
    elegiveis = []
    for s in todos:
        # Dia atual da campanha 26
        dia_26 = s.get('proximo_dia_26', 1)
        precisa_26 = not s.get('completo_26', False) and dia_26 <= len(crono_26)
        dia_key_26 = str(dia_26)
        ja_foi_26 = s.get('campanha_26', {}).get(dia_key_26, {}).get('status') == 'enviado'
        if precisa_26 and ja_foi_26:
            precisa_26 = False  # ja recebeu esse dia hoje
        
        # Onboarding
        idx = s.get('indice_onb', 0)
        precisa_onb = idx < len(crono_onb)
        if precisa_onb:
            dia_onb_esperado = crono_onb[idx]['dia']
            dia_key_onb = str(dia_onb_esperado)
            ja_foi_onb = s.get('onboarding', {}).get(dia_key_onb, {}).get('status') == 'enviado'
            if ja_foi_onb:
                precisa_onb = False
            else:
                data_inicio = s.get('data_inicio', s.get('criado_em', hoje.isoformat()))
                try:
                    inicio = datetime.fromisoformat(data_inicio)
                    dias_passados = (hoje - inicio).days + 1
                    precisa_onb = dias_passados >= dia_onb_esperado
                except:
                    precisa_onb = True
        
        if precisa_26 or precisa_onb:
            qtde = (1 if precisa_26 else 0) + (1 if precisa_onb else 0)
            elegiveis.append((s, precisa_26, precisa_onb, qtde))
    
    # Prioridade: quem NUNCA recebeu nada (Dia 1 pendente) primeiro
    elegiveis.sort(key=lambda x: (
        0 if x[1] and x[0].get('campanha_26', {}) == {} else 1,  # nunca recebeu 26 primeiro
        0 if x[2] and x[0].get('onboarding', {}) == {} else 1,   # nunca recebeu onboarding primeiro
        x[0].get('data_inicio', x[0].get('criado_em', ''))       # depois por data
    ))
    
    print(f'📋 Leads elegiveis hoje: {len(elegiveis)}')
    print(f'🎯 Limite diario: {max_emails} emails')
    
    # Calcular quantos leads cabem no lote
    emails_restantes = max_emails
    lote = []
    for s, precisa_26, precisa_onb, qtde in elegiveis:
        if qtde <= emails_restantes:
            lote.append((s, precisa_26, precisa_onb))
            emails_restantes -= qtde
        else:
            break
    
    print(f'🎯 Leads no lote de hoje: {len(lote)} (ate {max_emails - emails_restantes} emails)')
    print()
    
    enviados = 0
    erros = 0
    pulados = 0
    
    for i, (s, precisa_26, precisa_onb) in enumerate(lote):
        email = s['email']
        nome = s['nome']
        resultados = []
        
        # --- Campanha 26 ---
        if precisa_26:
            dia_num = s.get('proximo_dia_26', 1)
            if dia_num <= len(crono_26):
                dia_key = str(dia_num)
                if dia_key not in s.get('campanha_26', {}):
                    template = obter_template_26(dia_num)
                    if template:
                        r = enviar(email, nome, template, crono_26[dia_num-1]['subject'])
                        if r['success']:
                            s.setdefault('campanha_26', {})[dia_key] = {'status': 'enviado', 'data': data_hoje}
                            s['contador_26'] = dia_num
                            s['proximo_dia_26'] = dia_num + 1
                            if dia_num >= len(crono_26):
                                s['completo_26'] = True
                            enviados += 1
                            resultados.append(f'26[{dia_num}]✅')
                        else:
                            s.setdefault('campanha_26', {})[dia_key] = {'status': 'falhou', 'erro': r.get('error','')}
                            erros += 1
                            resultados.append(f'26[{dia_num}]❌')
                    else:
                        # Pular dias sem template
                        s['proximo_dia_26'] = dia_num + 1
                        s.setdefault('campanha_26', {})[dia_key] = {'status': 'pulado', 'motivo': 'template'}
                        pulados += 1
                        resultados.append(f'26[{dia_num}]⏭️')
        
        # --- Onboarding ---
        if precisa_onb:
            idx = s.get('indice_onb', 0)
            if idx < len(crono_onb):
                dia_onb = str(crono_onb[idx]['dia'])
                if dia_onb not in s.get('onboarding', {}):
                    template = obter_template_onb(idx)
                    if template:
                        r = enviar(email, nome, template, crono_onb[idx]['subject'])
                        if r['success']:
                            s.setdefault('onboarding', {})[dia_onb] = {'status': 'enviado', 'data': data_hoje}
                            s['contador_onb'] = idx + 1
                            s['indice_onb'] = idx + 1
                            if idx + 1 >= len(crono_onb):
                                s['completo_onb'] = True
                            enviados += 1
                            resultados.append(f'Onb[{dia_onb}]✅')
                        else:
                            s.setdefault('onboarding', {})[dia_onb] = {'status': 'falhou', 'erro': r.get('error','')}
                            erros += 1
                            resultados.append(f'Onb[{dia_onb}]❌')
                    else:
                        s['indice_onb'] = idx + 1
                        s['contador_onb'] = idx + 1
                        s.setdefault('onboarding', {})[dia_onb] = {'status': 'pulado', 'motivo': 'template'}
                        pulados += 1
                        resultados.append(f'Onb[{dia_onb}]⏭️')
        
        s['ultimo_envio'] = hoje.isoformat()
        salvar_status(s)
        
        status_str = ' '.join(resultados) if resultados else '(nada)'
        print(f'  ({i+1}/{len(lote)}) {nome[:30]:30s} <{email[:25]:25s}> {status_str}')
        time.sleep(0.5)
    
    print(f'\n📊 RESULTADO DO DIA {data_hoje}:')
    print(f'  ✅ Enviados: {enviados}')
    print(f'  ❌ Erros: {erros}')
    print(f'  ⏭️ Pulados: {pulados}')
    print(f'  👥 Leads processados: {len(lote)}')
    print(f'  📋 Restantes na fila: {len(elegiveis) - len(lote)}')
    
    return enviados, erros, len(lote)

def main():
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    if '--limite' in args:
        idx = args.index('--limite')
        limite = int(args[idx+1]) if len(args) > idx+1 else LIMITE_DIARIO
    else:
        limite = LIMITE_DIARIO
    
    processar_diario(max_emails=limite)

if __name__ == '__main__':
    main()
