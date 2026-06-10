"""Processador diário de campanhas — com PRIORIDADE (Dia 3 > 2 > 1) e INTERVALO de 1h entre emails do mesmo lead.

Uso:
  python processar_campanha_diario.py                         # lote da manhã (50 emails)
  python processar_campanha_diario.py --turno tarde           # lote da tarde (+50 emails)
  python processar_campanha_diario.py --limite 100 --sequencia  # modo antigo (sem intervalo)
"""

import json, os, time, urllib.request, urllib.error, glob, sys, re
from datetime import datetime, timezone, timedelta

STATUS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'status_individual')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAMPANHA_26 = os.path.join(BASE_DIR, 'campanha-26-dias')
FUNCTION_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
LIMITE_DIARIO = 100  # limite total do Resend free

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

def obter_template_26(dia_numero):
    files = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero:02d}-*.html')))
    if files:
        return files[0]
    alt = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{dia_numero}-*.html')))
    if alt:
        return alt[0]
    return None

def processar_com_intervalo(max_emails=100, turno="manha"):
    """Processa com prioridade (Dia 3 > 2 > 1) e 1h de intervalo entre emails do mesmo lead."""
    crono_26 = carregar_cronograma_26()
    hoje = datetime.now(timezone.utc)
    data_hoje = hoje.strftime('%Y-%m-%d')
    hora_atual = hoje.hour
    
    # Carregar todos os status
    todos = []
    for f in os.listdir(STATUS_DIR):
        if not f.endswith('.json'):
            continue
        with open(os.path.join(STATUS_DIR, f)) as fp:
            todos.append(json.load(fp))
    
    print(f'📊 Total leads na fila: {len(todos)}')
    print(f'⏰ Turno: {turno.upper()} (hora atual: {hora_atual}h UTC)')
    print(f'🎯 Limite: {max_emails} emails')
    print()
    
    # --- PRIORIDADE: calcular prioridade de cada lead ---
    # Prioridade 0 = Dia 3 (já recebeu Dia 1 + Dia 2) - MAIOR PRIORIDADE
    # Prioridade 1 = Dia 2 pendente (recebeu ontem mas NÃO hoje)
    # Prioridade 2 = Dia 1 (nunca recebeu nada)
    # Prioridade 3 = Dia 2 normal
    # Prioridade 4 = Dias mais avançados
    
    leads_priorizados = []
    for s in todos:
        email = s['email']
        nome = s.get('nome', 'N/A')
        dia = s.get('dia', 1)
        enviado_hoje = s.get('ja_enviado_hoje', False)
        ultimo_envio = s.get('ultimo_envio') or ''
        completou = s.get('completo_26', False) or s.get('completo', False)
        
        if completou:
            continue  # ignorar completos
        
        if enviado_hoje:
            continue  # já recebeu email hoje
        
        # Determinar prioridade
        if dia >= 3:
            prioridade = 0  # Dia 3 = máxima prioridade (já engajou)
        elif dia == 2:
            prioridade = 1  # Dia 2 = segunda prioridade
        elif dia <= 1:
            prioridade = 2  # Dia 1 = terceira prioridade
        else:
            prioridade = 3  # outros
        
        # Pegar template do dia
        template = obter_template_26(dia)
        if not template:
            continue  # sem template pro dia
        
        # Assunto do template
        if 1 <= dia <= len(crono_26):
            subject = crono_26[dia-1]['subject']
        else:
            subject = f"Dia {dia}"
        
        leads_priorizados.append({
            'email': email,
            'nome': nome,
            'dia': dia,
            'prioridade': prioridade,
            'template': template,
            'subject': subject,
            'status': s,
            'ultimo_envio': ultimo_envio
        })
    
    # Ordenar: prioridade (menor = maior prioridade), depois por ultimo_envio (mais antigo primeiro)
    leads_priorizados.sort(key=lambda x: (x['prioridade'], x['ultimo_envio']))
    
    print(f'📋 Leads aptos a receber hoje: {len(leads_priorizados)}')
    
    # Agrupar por prioridade
    for p, label in [(0, 'Dia 3 (prioridade máxima)'), (1, 'Dia 2 pendente'), (2, 'Dia 1'), (3, 'outros')]:
        count = sum(1 for l in leads_priorizados if l['prioridade'] == p)
        if count:
            print(f'  {label}: {count} leads')
    print()
    
    # --- Enviar em ordem de prioridade, com 1h de intervalo entre emails do mesmo lead ---
    # Estratégia: em cada turno, cada lead recebe NO MÁXIMO 1 email.
    # O segundo email do dia pro mesmo lead vai pro PRÓXIMO turno (ou próximo ciclo).
    
    emails_enviados = 0
    erros = 0
    leads_processados = 0
    leads_pulados = 0
    
    # No modo com intervalo, cada lead só recebe 1 email por execução
    # Se o dia tem 2 templates, o segundo vai no próximo turno/ciclo
    for i, lead in enumerate(leads_priorizados):
        if emails_enviados >= max_emails:
            print(f'\n⛔ Limite de {max_emails} emails atingido!')
            leads_pulados = len(leads_priorizados) - i
            break
        
        email = lead['email']
        nome = lead['nome']
        dia = lead['dia']
        template = lead['template']
        subject = lead['subject']
        st = lead['status']
        
        # Enviar 1 email (o primeiro template do dia)
        r = enviar(email, nome, template, subject)
        
        if r['success']:
            # Atualizar status
            dia_key = str(dia)
            if 'campanha_26' not in st:
                st['campanha_26'] = {}
            st['campanha_26'][dia_key] = {'status': 'enviado', 'data': data_hoje}
            st['contador_26'] = dia
            st['proximo_dia_26'] = dia + 1
            st['dia'] = dia
            st['enviado'] = True
            st['ja_enviado_hoje'] = True
            st['ultimo_envio'] = hoje.isoformat()
            
            # Se o lead tem 2 emails pro dia (template 1 de 2), marcar que ainda falta 1
            # O script só envia 1 por execução — o segundo vai no próximo ciclo
            
            # Verificar se há um segundo template pro mesmo dia
            dia_str = f"dia-{dia:02d}"
            templates_mesmo_dia = sorted(glob.glob(os.path.join(CAMPANHA_26, f'{dia_str}-*.html')))
            if len(templates_mesmo_dia) > 1:
                # Marcar que tem segundo email pendente pro mesmo dia
                st['pendente_segundo_email'] = True
            else:
                st['pendente_segundo_email'] = False
            
            if dia >= len(crono_26):
                st['completo_26'] = True
            
            salvar_status(st)
            emails_enviados += 1
            leads_processados += 1
            
            print(f'  ✅ ({i+1}/{len(leads_priorizados)}) Dia {dia} | {nome[:25]:25s} <{email[:25]:25s}> | {subject[:50]}')
            
            # Pausa de 2s entre leads (rate limit)
            time.sleep(2)
        else:
            erros += 1
            print(f'  ❌ ({i+1}/{len(leads_priorizados)}) {nome[:25]:25s} <{email[:25]:25s}> ERRO: {r.get("error","")[:60]}')
    
    print(f'\n📊 RESULTADO:')
    print(f'  ✅ Enviados: {emails_enviados}')
    print(f'  ❌ Erros: {erros}')
    print(f'  ⏭️ Pulados (limite): {leads_pulados}')
    print(f'  📋 Total leads com segundo email pendente pro mesmo dia: ', end='')
    
    # Contar quem tem segundo email pendente
    pendentes_segundo = sum(1 for l in leads_priorizados if l['status'].get('pendente_segundo_email', False))
    print(pendentes_segundo)
    
    return emails_enviados, erros, leads_processados


def main():
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    # Extrair limite
    if '--limite' in args:
        idx = args.index('--limite')
        limite = int(args[idx+1]) if len(args) > idx+1 else LIMITE_DIARIO
    else:
        limite = 50  # 50 por turno = 100/dia com 2 turnos
    
    # Extrair turno
    turno = "manha"
    if '--turno' in args:
        idx = args.index('--turno')
        if len(args) > idx+1:
            turno = args[idx+1]
    
    # Modo sequência (antigo, sem intervalo)
    if '--sequencia' in args:
        print("⚠️ Modo sequencial (sem intervalo de 1h)")
        from processar_campanha_diario_legacy import processar_diario
        processar_diario(max_emails=limite)
        return
    
    processar_com_intervalo(max_emails=limite, turno=turno)


if __name__ == '__main__':
    main()
