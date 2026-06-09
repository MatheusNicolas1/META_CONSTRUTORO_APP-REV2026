"""Sistema de envio agendado por dia — substitui o disparo em massa"""

import csv, json, os, time, urllib.request, urllib.error, glob, sys, hashlib
from datetime import datetime, timezone
from pathlib import Path

# Caminhos base
BASE_DIR = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
CONTATOS_CSV = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv'
STATUS_DIR = os.path.join(BASE_DIR, 'status_individual')
CAMPANHA_26 = os.path.join(BASE_DIR, 'campanha-26-dias')
CAMPANHA_ONB = os.path.join(BASE_DIR, 'campanha-onboarding')
HASH_FILE = os.path.join(BASE_DIR, '.csv_hash')
FUNCTION_URL = os.environ.get(
    "FUNCTION_URL",
    "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/send-campaign-now"
)

os.makedirs(STATUS_DIR, exist_ok=True)

def sanitizar(email):
    """Sanitiza email pra nome de arquivo."""
    return email.replace('@', '_at_').replace('.', '_dot_').replace('-', '_dash_').replace('|', '_pipe_').replace(' ', '_')

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

def enviar_email(email, nome, template_path, subject):
    """Envia via Edge Function."""
    if not os.path.exists(template_path):
        return {'success': False, 'error': f'Template não encontrado: {template_path}'}
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace('{{nome_empresa}}', nome)
    
    payload = json.dumps({
        'subject': f'{subject} — Meta Construtor',
        'html': html,
        'emails': [{'to': email, 'nome_empresa': nome}]
    }).encode('utf-8')
    
    req = urllib.request.Request(
        FUNCTION_URL, data=payload,
        headers={'Content-Type': 'application/json'}, method='POST'
    )
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

def csv_mudou():
    """Verifica se o CSV foi alterado pelo hash."""
    if not os.path.exists(CONTATOS_CSV):
        return False
    with open(CONTATOS_CSV, 'rb') as f:
        content = f.read()
    hash_atual = hashlib.md5(content).hexdigest()
    if os.path.exists(HASH_FILE):
        with open(HASH_FILE) as f:
            hash_anterior = f.read().strip()
        return hash_atual != hash_anterior
    return True

def atualizar_hash():
    with open(CONTATOS_CSV, 'rb') as f:
        content = f.read()
    with open(HASH_FILE, 'w') as f:
        f.write(hashlib.md5(content).hexdigest())

def criar_status_para_novos():
    """Cria arquivos de status pra novos leads detectados no CSV."""
    if not csv_mudou() and os.path.exists(HASH_FILE):
        return []
    
    with open(CONTATOS_CSV, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        contatos = list(reader)
    
    criados = []
    for row in contatos:
        email = row.get('email', '').strip().lower()
        if not email or '@' not in email:
            continue
        if os.path.exists(status_path(email)):
            continue
        
        nome = row.get('nome', '').strip() or email.split('@')[0].replace('.', ' ').title()
        
        status = {
            'nome': nome,
            'email': email,
            'tipo': row.get('origem', ''),
            'campanha_26': {},
            'onboarding': {},
            'contador_26': 0,
            'contador_onb': 0,
            'criado_em': datetime.now(timezone.utc).isoformat(),
            'ultimo_envio': None,
            'completo_26': False,
            'completo_onb': False,
            'proximo_dia_26': 1,
            'proximo_dia_onb': 1,  # ref ao cronograma (1,2,3,5,7,15,21,30)
            'indice_onb': 0,  # indice no array (0 a 7)
            'data_inicio': datetime.now(timezone.utc).isoformat()
        }
        salvar_status(status)
        criados.append((nome, email))
    
    atualizar_hash()
    return criados

def processar_fila(diario=True):
    """
    Processa a fila de envios.
    diario=True: envia no maximo 1 email por lead (do dia atual)
    diario=False: fallback antigo (todos de uma vez)
    """
    if not diario:
        return _processar_antigo()
    return _processar_diario()

def _processar_diario():
    """Envia APENAS o email do dia atual pra cada lead que estiver na fila."""
    crono_26 = carregar_cronograma_26()
    crono_onb = carregar_cronograma_onb()
    
    hoje = datetime.now(timezone.utc)
    
    # Carregar todos os status
    status_list = []
    for f in os.listdir(STATUS_DIR):
        if not f.endswith('.json'):
            continue
        with open(os.path.join(STATUS_DIR, f)) as fp:
            status_list.append(json.load(fp))
    
    enviados = 0
    erros = 0
    pulados = 0
    
    for s in status_list:
        email = s['email']
        nome = s['nome']
        data_inicio = datetime.fromisoformat(s.get('data_inicio', s['criado_em']))
        dias_decorridos = (hoje - data_inicio).days + 1  # dia 1 = hoje
        
        # --- CAMPANHA 26 ---
        if not s.get('completo_26', False):
            prox = s.get('proximo_dia_26', 1)
            # O proximo dia a enviar DEVE corresponder ao dia decorrido
            # Ex: se começou hoje (dias_decorridos=1), envia dia 1
            if prox <= len(crono_26) and prox == dias_decorridos:
                # Verificar se ja nao enviou esse dia
                if str(prox) not in s['campanha_26']:
                    files = sorted(glob.glob(os.path.join(CAMPANHA_26, f'dia-{prox:02d}-*.html')))
                    if files:
                        r = enviar_email(email, nome, files[0], crono_26[prox-1]['subject'])
                        if r['success']:
                            s['campanha_26'][str(prox)] = {'status': 'enviado', 'data': hoje.isoformat()}
                            s['ultimo_envio'] = hoje.isoformat()
                            s['contador_26'] = prox
                            s['proximo_dia_26'] = prox + 1
                            if prox == len(crono_26):
                                s['completo_26'] = True
                            enviados += 1
                        else:
                            s['campanha_26'][str(prox)] = {'status': 'falhou', 'erro': r.get('error','')}
                            erros += 1
                        salvar_status(s)
                    else:
                        # Pular dias sem template
                        s['proximo_dia_26'] = prox + 1
                        s['campanha_26'][str(prox)] = {'status': 'pulado', 'motivo': 'template'}
                        salvar_status(s)
                        pulados += 1
            elif prox < dias_decorridos:
                # Atrasou — avanca ate o dia atual (max 1 por dia)
                pulados += 1
        
        # --- ONBOARDING ---
        if not s.get('completo_onb', False):
            indice = s.get('indice_onb', 0)
            if indice < len(crono_onb):
                dia_esperado = crono_onb[indice]['dia']
                # O onboarding tem delays absolutos
                if dias_decorridos >= dia_esperado:
                    dia_str = str(dia_esperado)
                    if dia_str not in s['onboarding']:
                        tp = os.path.join(CAMPANHA_ONB, crono_onb[indice]['template'])
                        if not os.path.exists(tp):
                            tp = os.path.join(BASE_DIR, crono_onb[indice]['template'])
                        if os.path.exists(tp):
                            r = enviar_email(email, nome, tp, crono_onb[indice]['subject'])
                            if r['success']:
                                s['onboarding'][dia_str] = {'status': 'enviado', 'data': hoje.isoformat()}
                                s['ultimo_envio'] = hoje.isoformat()
                                s['contador_onb'] = indice + 1
                                s['indice_onb'] = indice + 1
                                if indice + 1 >= len(crono_onb):
                                    s['completo_onb'] = True
                                enviados += 1
                            else:
                                s['onboarding'][dia_str] = {'status': 'falhou', 'erro': r.get('error','')}
                                erros += 1
                            salvar_status(s)
    
    return enviados, erros, pulados

def _processar_antigo():
    """Fallback: envia todos os emails de uma vez (modo legado)."""
    print('⚠️ Modo antigo — disparo em massa. Use diario=True para envio por dia.')
    return 0, 0, 0

def main():
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    if '--criar-status' in args:
        novos = criar_status_para_novos()
        print(f'✅ {len(novos)} novos status criados')
        return
    
    if '--filas' in args:
        # Mostrar filas
        status_list = []
        for f in os.listdir(STATUS_DIR):
            if not f.endswith('.json'):
                continue
            with open(os.path.join(STATUS_DIR, f)) as fp:
                status_list.append(json.load(fp))
        
        na_fila_26 = [s for s in status_list if not s.get('completo_26', False)]
        na_fila_onb = [s for s in status_list if not s.get('completo_onb', False)]
        completos = [s for s in status_list if s.get('completo_26', False) and s.get('completo_onb', False)]
        
        print(f'📊 STATUS DAS FILAS:')
        print(f'  Total leads: {len(status_list)}')
        print(f'  ✅ Completos (26+8): {len(completos)}')
        print(f'  ⏳ Fila campanha 26: {len(na_fila_26)}')
        print(f'  ⏳ Fila onboarding: {len(na_fila_onb)}')
        print()
        print(f'  Exemplo fila 26 (prox dia):')
        for s in na_fila_26[:3]:
            prox = s.get('proximo_dia_26', 1)
            print(f'    {s["nome"]} <{s["email"]}>: dia {prox}/26')
        print(f'  Exemplo fila onboarding:')
        for s in na_fila_onb[:3]:
            idx = s.get('indice_onb', 0)
            print(f'    {s["nome"]} <{s["email"]}>: indice {idx}/8')
        return
    
    # Padrão: processar fila do dia
    enviados, erros, pulados = processar_fila(diario=True)
    
    # Também criar status pra novos leads
    novos = criar_status_para_novos()
    
    print(f'🔔 PROCESSAMENTO DIÁRIO:')
    print(f'  Novos leads detectados: {len(novos)}')
    print(f'  Emails enviados hoje: {enviados}')
    print(f'  Erros: {erros}')
    print(f'  Pulados (atraso/dia): {pulados}')
    
    if novos:
        for n in novos:
            print(f'  ➕ Novo status: {n[0]} <{n[1]}>')

if __name__ == '__main__':
    main()
