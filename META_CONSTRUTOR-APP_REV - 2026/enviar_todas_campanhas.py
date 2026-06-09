"""
Script de envio em lote para ambas as campanhas do Meta Construtor.

ENVIO POR HORÁRIO (máx 50/lote):
  - Lista 1 (7:00): primeiros 50 contatos
  - Lista 2 (11:00): próximos 50 contatos
  - Total: 222 contatos com email, 222 disparos por campanha
  - CCO: matheusnicolas.org@gmail.com em todos os disparos

Rate limit Resend: 2 emails/segundo, 100/dia (free tier)
Estratégia: 50 emails por lote, espaçado por horários diferentes

Uso:
  python enviar_todas_campanhas.py [opcao]

Opções:
  --all          Envia a campanha inteira (todos os dias sequencialmente)
  --dia N        Envia apenas o dia N
  --status       Mostra status de envio
  --testar N     Envia teste para chef (sem CCO duplicado)
"""
import json
import sys
import os
import time
import csv
import hashlib
import urllib.request
import urllib.error
from datetime import datetime, timedelta

SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"
FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/send-campaign-now"
PROJ_DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# CAMPANHA 1: 26 dias de conteúdo variado
# ============================================================
CAMPANHA_26_TEMPLATES_DIR = os.path.join(PROJ_DIR, "campanha-26-dias")
CAMPANHA_26_CRONOGRAMA = os.path.join(CAMPANHA_26_TEMPLATES_DIR, "cronograma.json")

# ============================================================
# CAMPANHA 2: Onboarding (8 e-mails em 30 dias)
# ============================================================
CAMPANHA_ONBOARDING_DIR = os.path.join(PROJ_DIR, "campanha-onboarding")
CAMPANHA_ONBOARDING_CRONOGRAMA = os.path.join(CAMPANHA_ONBOARDING_DIR, "cronograma.json")

# Base de contatos
CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_FILE = os.path.join(PROJ_DIR, "status_envios.json")


def carregar_contatos():
    """Carrega contatos com email do CSV."""
    contatos = []
    with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get("email", "").strip()
            nome = row.get("nome", "").strip() or row.get("empresa", "").strip() or "Lead"
            if email:
                contatos.append({"email": email, "nome_empresa": nome})
    print(f"📊 {len(contatos)} contatos com email carregados")
    return contatos


def carregar_cronograma(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def carregar_template(caminho_template):
    with open(caminho_template, "r", encoding="utf-8") as f:
        return f.read()


def send_via_supabase(html, subject, to_email, nome_empresa="Lead"):
    """Envia via Edge Function."""
    payload = json.dumps({
        "subject": subject,
        "html": html,
        "emails": [{"to": to_email, "nome_empresa": nome_empresa}]
    }).encode("utf-8")

    req = urllib.request.Request(
        FUNCTION_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        resp = urllib.request.urlopen(req, timeout=45)
        body = resp.read().decode()
        return {"success": True, "data": json.loads(body)}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"success": False, "error": body, "code": e.code}
    except Exception as e:
        return {"success": False, "error": str(e)}


def enviar_bloco(contatos, template_html, subject, inicio=0, tamanho_lote=50):
    """Envia um bloco de contatos com rate limiting de 2/seg."""
    fim = min(inicio + tamanho_lote, len(contatos))
    bloco = contatos[inicio:fim]
    
    print(f"\n📦 Bloco {inicio+1}-{fim} de {len(contatos)}")
    print(f"   Subject: {subject}")
    
    resultados = []
    for i, contato in enumerate(bloco):
        # Personaliza template: substitui placeholders
        html_personalizado = template_html.replace("{{nome_empresa}}", contato["nome_empresa"])
        
        # Gera contact_id como hash do email (consistente entre envios)
        contact_id = hashlib.sha256(contato["email"].encode()).hexdigest()[:16]
        html_personalizado = html_personalizado.replace("{{CONTACT_ID}}", contact_id)
        
        result = send_via_supabase(html_personalizado, subject, contato["email"], contato["nome_empresa"])
        resultados.append({"email": contato["email"], "empresa": contato["nome_empresa"], **result})
        
        status = "✅" if result["success"] else "❌"
        print(f"   {status} [{i+1}/{len(bloco)}] {contato['email']} ({contato['nome_empresa'][:25]})")
        
        # Rate limit: 2 emails/segundo
        if i < len(bloco) - 1:
            time.sleep(0.5)
    
    sucessos = sum(1 for r in resultados if r["success"])
    falhas = sum(1 for r in resultados if not r["success"])
    print(f"\n📊 Bloco: {sucessos} ✅ / {falhas} ❌")
    
    return resultados, fim


def salvar_status(campanha, dia_info, resultados, bloco_num):
    """Salva status incremental."""
    status = {}
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, "r", encoding="utf-8") as f:
            status = json.load(f)
    
    chave = f"{campanha}_dia{dia_info['dia']}"
    if chave not in status:
        status[chave] = []
    
    status[chave].append({
        "bloco": bloco_num,
        "timestamp": datetime.now().isoformat(),
        "resultados": resultados
    })
    
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)
    
    return status


def enviar_campanha_dia(campanha_nome, cronograma, templates_dir, contatos, dia_num, inicio=0):
    """Envia um dia específico de uma campanha."""
    dia_info = next((d for d in cronograma if d["dia"] == dia_num), None)
    if not dia_info:
        print(f"❌ Dia {dia_num} não encontrado no cronograma {campanha_nome}")
        return None, 0
    
    template_path = os.path.join(templates_dir, dia_info["template"])
    if not os.path.exists(template_path):
        # Tenta buscar na pasta de scripts
        template_path = os.path.expanduser(f"~/AppData/Local/hermes/scripts/{dia_info['template']}")
        if not os.path.exists(template_path):
            print(f"❌ Template não encontrado: {dia_info['template']}")
            return None, 0
    
    template_html = carregar_template(template_path)
    subject = f"{dia_info['subject']} — Meta Construtor"
    
    print(f"\n{'='*60}")
    print(f"📧 {campanha_nome} — Dia {dia_num}: {dia_info['subject']}")
    print(f"{'='*60}")
    
    resultados, novo_inicio = enviar_bloco(contatos, template_html, subject, inicio)
    salvar_status(campanha_nome, dia_info, resultados, inicio // 50 + 1)
    
    return resultados, novo_inicio


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    opcao = sys.argv[1]
    
    if opcao == "--status":
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, "r", encoding="utf-8") as f:
                print(json.dumps(json.load(f), ensure_ascii=False, indent=2))
        else:
            print("📭 Nenhum status de envio encontrado")
        return
    
    contatos = carregar_contatos()
    cronograma_26 = carregar_cronograma(CAMPANHA_26_CRONOGRAMA)
    cronograma_onboarding = carregar_cronograma(CAMPANHA_ONBOARDING_CRONOGRAMA)
    
    if opcao == "--testar":
        # Envia apenas 1 email de cada campanha pro chef
        email_teste = sys.argv[2] if len(sys.argv) > 2 else "matheusnicolas.org@gmail.com"
        print(f"\n🧪 TESTE — enviando para {email_teste}")
        
        # Teste: Dia 1 da campanha 26
        dia_info_26 = cronograma_26[0]
        template_path = os.path.join(CAMPANHA_26_TEMPLATES_DIR, f"dia-01-{dia_info_26['tone']}.html")
        if os.path.exists(template_path):
            html = carregar_template(template_path)
            subject = f"{dia_info_26['subject']} — Meta Construtor"
            result = send_via_supabase(html, subject, email_teste, "Chef Nicolas")
            print(f"   {'✅' if result['success'] else '❌'} Campanha 26 - Dia 1: {str(result.get('data', result.get('error', '?')))[:100]}")
            time.sleep(1)
        
        # Teste: Dia 1 da onboarding
        dia_info_onb = cronograma_onboarding[0]
        template_path = os.path.expanduser(f"~/AppData/Local/hermes/scripts/{dia_info_onb['template']}")
        if os.path.exists(template_path):
            html = carregar_template(template_path)
            subject = f"{dia_info_onb['subject']} — Meta Construtor"
            result = send_via_supabase(html, subject, email_teste, "Chef Nicolas")
            print(f"   {'✅' if result['success'] else '❌'} Onboarding - Dia 1: {str(result.get('data', result.get('error', '?')))[:100]}")
        
        return
    
    elif opcao.startswith("--campanha26-dia"):
        dia = int(opcao.split("-")[-1])
        enviar_campanha_dia("Campanha 26 Dias", cronograma_26, CAMPANHA_26_TEMPLATES_DIR, contatos, dia)
    
    elif opcao.startswith("--onboarding-dia"):
        dia = int(opcao.split("-")[-1])
        enviar_campanha_dia("Onboarding", cronograma_onboarding, 
                           os.path.expanduser("~/AppData/Local/hermes/scripts"), contatos, dia)
    
    elif opcao == "--bloco26":
        # Envia bloco específico da campanha 26: dia + offset
        dia = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        offset = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        enviar_campanha_dia("Campanha 26 Dias", cronograma_26, CAMPANHA_26_TEMPLATES_DIR, contatos, dia, offset)
    
    else:
        print(f"❌ Opção desconhecida: {opcao}")
        print(__doc__)


if __name__ == "__main__":
    main()
