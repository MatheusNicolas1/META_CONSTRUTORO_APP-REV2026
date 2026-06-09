"""Script de envio da campanha de 26 e-mails via Supabase Edge Function.

Import: import_campaign_email_sender

Esta versão usa as Edge Functions send-campaign-now já deployadas no Supabase,
que têm acesso real à RESEND_API_KEY nos secrets.

Uso:
  python enviar_campanha.py [dia] [email]
  Ex: python enviar_campanha.py 1 matheusnicolas.org@gmail.com
"""
import json
import sys
import os
from datetime import datetime, timedelta

SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"
FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/send-campaign-now"
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "campanha-26-dias")

def load_cronograma():
    path = os.path.join(TEMPLATES_DIR, "cronograma.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_template(dia_numero):
    """Carrega o HTML do template do dia."""
    # Busca arquivo que começa com dia-NN- na pasta
    import glob
    path = os.path.join(TEMPLATES_DIR, f"dia-{dia_numero:02d}-*.html")
    files = glob.glob(path)
    if not files:
        raise FileNotFoundError(f"Nenhum template encontrado para dia {dia_numero:02d}: {path}")
    with open(files[0], "r", encoding="utf-8") as f:
        return f.read()

def send_via_supabase(html: str, subject: str, to_email: str) -> dict:
    """Envia email via Supabase Edge Function que tem acesso à RESEND_API_KEY."""
    import urllib.request
    
    payload = json.dumps({
        "subject": subject,
        "html": html,
        "emails": [{"to": to_email, "nome_empresa": "Lead"}]
    }).encode("utf-8")
    
    req = urllib.request.Request(
        FUNCTION_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        body = resp.read().decode()
        return {"success": True, "data": json.loads(body)}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"success": False, "error": body, "code": e.code}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 3:
        print("Uso: python enviar_campanha.py <dia> <email>")
        print("  dia: 1-26 (número do dia da campanha)")
        print("  email: destinatário")
        print()
        print("Ex: python enviar_campanha.py 1 matheusnicolas.org@gmail.com")
        print("    python enviar_campanha.py --all matheusnicolas.org@gmail.com  (envia todos)")
        sys.exit(1)
    
    arg1 = sys.argv[1]
    to_email = sys.argv[2]
    
    cronograma = load_cronograma()
    hoje = datetime.now()
    
    if arg1 == "--all":
        # Envia todos os 26 dias em sequência
        resultados = []
        for idx, dia_info in enumerate(cronograma, 1):
            dia = idx
            subject = f"{dia_info['subject']} — Meta Construtor"
            html = load_template(dia)
            
            print(f"\n📨 [{dia}/26] {dia_info['subject']} [{dia_info['tone']}] → {to_email}")
            result = send_via_supabase(html, subject, to_email)
            resultados.append({"dia": dia, **result})
            
            if result["success"]:
                print(f"   ✅ Enviado!")
            else:
                print(f"   ❌ Erro: {str(result.get('error', 'desconhecido'))[:200]}")
        
        sucessos = sum(1 for r in resultados if r["success"])
        falhas = sum(1 for r in resultados if not r["success"])
        print(f"\n{'='*50}")
        print(f"📊 Total: {sucessos} enviados, {falhas} falhas de {len(resultados)}")
    else:
        # Envia um dia específico
        dia = int(arg1)
        if dia < 1 or dia > len(cronograma):
            print(f"❌ Dia {dia} não encontrado (válido: 1-{len(cronograma)})")
            sys.exit(1)
        dia_info = cronograma[dia - 1]
        
        subject = f"{dia_info['subject']} — Meta Construtor"
        html = load_template(dia)
        
        data_envio = datetime.now().strftime("%Y-%m-%d %H:%M")
        print(f"\n📅 Campanha - Meta Construtor")
        print(f"{'='*50}")
        print(f"📧 Dia {dia}: {dia_info['subject']}")
        print(f"🎭 Tom: {dia_info['tone']}")
        print(f"📩 Para: {to_email}")
        print(f"⏰ Envio: {data_envio}")
        print(f"{'='*50}\n")
        
        result = send_via_supabase(html, subject, to_email)
        
        if result["success"]:
            print(f"✅ E-mail enviado com sucesso!")
            print(f"📋 Resposta: {json.dumps(result['data'], indent=2)}")
        else:
            print(f"❌ Falha no envio:")
            print(f"   Código: {result.get('code', 'N/A')}")
            print(f"   Erro: {result.get('error', 'Desconhecido')[:300]}")

if __name__ == "__main__":
    main()
