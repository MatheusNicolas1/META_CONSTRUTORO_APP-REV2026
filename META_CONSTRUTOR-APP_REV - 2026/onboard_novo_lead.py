"""
Onboard novo lead no Meta Construtor.

Quando um novo contato é adicionado ao CSV, este script:
1. Detecta leads novos (que não têm arquivo de status)
2. Cria o arquivo de status (mas NÃO envia emails — o envio é diário)
3. Atualiza o hash do CSV pra não reprocessar

O envio real dos emails é feito pelo `processar_campanha.py --diario` (rodado pelo cronjob),
que envia 1 email por dia por lead, respeitando os cronogramas.

Uso:
  python onboard_novo_lead.py --adicionar "Empresa,email@empresa.com,SP"
  python onboard_novo_lead.py --verificar
  python onboard_novo_lead.py --processar
  python onboard_novo_lead.py --fila
  python onboard_novo_lead.py --status email@exemplo.com
  python onboard_novo_lead.py --hash             # Mostra hash atual e count
"""
import json
import csv
import os
import sys
import urllib.request
import hashlib
import re
import time
import glob
from datetime import datetime

PROJ_DIR = os.path.dirname(os.path.abspath(__file__))
CONTATOS_CSV = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\PROSPECCAO\contatos_master.csv"
STATUS_DIR = os.path.join(PROJ_DIR, "status_individual")
HASH_FILE = os.path.join(STATUS_DIR, "_hash_csv.txt")
SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"
FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/send-campaign-now"

CAMPANHA_26 = os.path.join(PROJ_DIR, "campanha-26-dias")
CAMPANHA_ONBOARDING = os.path.join(PROJ_DIR, "campanha-onboarding")
ONBOARDING_SCRIPTS = os.path.expanduser("~/AppData/Local/hermes/scripts")

os.makedirs(STATUS_DIR, exist_ok=True)


def sanitizar(email):
    """Sanitiza email para nome de arquivo (Windows-safe)."""
    s = email.replace("@", "_at_").replace(".", "_dot_")
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    return s


def _hash_csv():
    """SHA256 do CSV completo."""
    with open(CONTATOS_CSV, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def csv_mudou():
    """Retorna True se o CSV foi modificado desde a última verificação."""
    if not os.path.exists(HASH_FILE):
        return False
    with open(HASH_FILE) as f:
        antigo = f.read().strip()
    return _hash_csv() != antigo


def atualizar_hash():
    """Atualiza o hash salvo."""
    with open(HASH_FILE, "w") as f:
        f.write(_hash_csv())


def carregar_contatos():
    """Carrega todos os contatos com email."""
    contatos = []
    with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            email = row.get("email", "").strip()
            nome = row.get("nome", "").strip() or "Lead"
            if email:
                contatos.append({"idx": i, "nome": nome, "email": email})
    return contatos


def status_path(email):
    """Caminho do arquivo de status para um email."""
    return os.path.join(STATUS_DIR, f"{sanitizar(email)}.json")


def ler_status(email):
    """Retorna dict de status ou None."""
    p = status_path(email)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return None


def salvar_status(email, nome, tipo, campanha=None, dia=None, status=None, msg=""):
    """Salva/atualiza status de um lead."""
    data = ler_status(email) or {
        "email": email,
        "nome": nome,
        "campanha_26": {},
        "onboarding": {},
        "criado_em": datetime.now().isoformat()
    }
    if campanha == "campanha_26":
        data["campanha_26"][str(dia)] = {"status": status, "msg": msg, "data": datetime.now().isoformat()}
    elif campanha == "onboarding":
        data["onboarding"][str(dia)] = {"status": status, "msg": msg, "data": datetime.now().isoformat()}
    elif tipo:
        data["tipo"] = tipo
    
    with open(status_path(email), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data


def verificar_novos():
    """Retorna lista de contatos que não têm arquivo de status."""
    if not csv_mudou() and os.path.exists(HASH_FILE):
        return []
    contatos = carregar_contatos()
    novos = []
    for c in contatos:
        if not os.path.exists(status_path(c["email"])):
            novos.append(c)
    return novos


def enviar_email(email, nome, template_path, subject):
    """Envia um e-mail individual via Edge Function."""
    if not os.path.exists(template_path):
        return {"success": False, "error": f"Template não encontrado: {template_path}"}
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()
    html = html.replace("{{nome_empresa}}", nome)
    
    payload = json.dumps({
        "subject": f"{subject} — Meta Construtor",
        "html": html,
        "emails": [{"to": email, "nome_empresa": nome}]
    }).encode("utf-8")
    
    req = urllib.request.Request(
        FUNCTION_URL, data=payload,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=45)
        return {"success": True, "data": json.loads(resp.read().decode())}
    except Exception as e:
        return {"success": False, "error": str(e)}


def processar_novo_lead(nome, email):
    """Processa onboarding completo para um lead novo."""
    # Carrega cronogramas
    with open(os.path.join(CAMPANHA_26, "cronograma.json"), encoding="utf-8") as f:
        crono_26 = json.load(f)
    with open(os.path.join(CAMPANHA_ONBOARDING, "cronograma.json"), encoding="utf-8") as f:
        crono_onb = json.load(f)
    
    print(f"\n🚀 Iniciando onboarding para {nome} <{email}>")
    print(f"   Campanha 26: {len(crono_26)} e-mails | Onboarding: {len(crono_onb)} e-mails")
    
    sucessos = falhas = 0
    
    # Campanha 26
    for i, dia_info in enumerate(crono_26):
        files = sorted(glob.glob(os.path.join(CAMPANHA_26, f"dia-{i+1:02d}-*.html")))
        if not files:
            print(f"   ⚠️ Dia {i+1}/26: template não encontrado")
            salvar_status(email, nome, None, "campanha_26", i+1, "pulado", "Template não encontrado")
            continue
        tp = files[0]
        
        r = enviar_email(email, nome, tp, dia_info["subject"])
        lbl = f"✅" if r["success"] else "❌"
        print(f"   {lbl} Dia {i+1}/26: {dia_info['subject'][:50]}...")
        salvar_status(email, nome, None, "campanha_26", i+1, "enviado" if r["success"] else "falhou", str(r.get("data", r.get("error", "?"))))
        if r["success"]: sucessos += 1
        else: falhas += 1
        time.sleep(0.5)
    
    # Onboarding
    for j, dia_info in enumerate(crono_onb):
        tp = os.path.join(CAMPANHA_ONBOARDING, dia_info["template"])
        if not os.path.exists(tp):
            tp = os.path.join(ONBOARDING_SCRIPTS, dia_info["template"])
        if not os.path.exists(tp):
            print(f"   ⚠️ Onb Dia {dia_info['dia']}: template não encontrado")
            continue
        
        r = enviar_email(email, nome, tp, dia_info["subject"])
        lbl = f"✅" if r["success"] else "❌"
        print(f"   {lbl} Onb Dia {dia_info['dia']}: {dia_info['subject'][:50]}...")
        salvar_status(email, nome, None, "onboarding", dia_info["dia"], "enviado" if r["success"] else "falhou", str(r.get("data", r.get("error", "?"))))
        if r["success"]: sucessos += 1
        else: falhas += 1
        time.sleep(0.5)
    
    print(f"\n📊 {nome}: {sucessos} enviados ✅ / {falhas} falhas ❌")
    return sucessos, falhas


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    opcao = sys.argv[1]
    
    if opcao == "--verificar":
        novos = verificar_novos()
        if novos:
            print(f"📋 {len(novos)} novo(s) lead(s) detectado(s):")
            for n in novos:
                print(f"   - {n['nome']} <{n['email']}>")
            print("\n💡 Use --processar para iniciar o onboarding")
        else:
            print("✅ Nenhum lead novo. Todos já processados.")
    
    elif opcao == "--processar":
        novos = verificar_novos()
        if not novos:
            print("✅ Nenhum lead novo para processar.")
            sys.exit(0)
        for n in novos:
            # Só criar status, sem enviar (envio é diário pelo processar_campanha.py)
            email = n["email"]
            nome = n["nome"]
            if os.path.exists(status_path(email)):
                print(f"   ⏭️ {nome}: já tem status")
                continue
            status = {
                "nome": nome,
                "email": email,
                "campanha_26": {},
                "onboarding": {},
                "contador_26": 0,
                "contador_onb": 0,
                "criado_em": datetime.now().isoformat(),
                "ultimo_envio": None,
                "completo_26": False,
                "completo_onb": False,
                "proximo_dia_26": 1,
                "proximo_dia_onb": 1,
                "indice_onb": 0,
                "data_inicio": datetime.now().isoformat()
            }
            with open(status_path(email), "w") as f:
                json.dump(status, f, indent=2, ensure_ascii=False)
            print(f"   ✅ {nome}: status criado (entra na fila diária)")
        atualizar_hash()
        print(f"\n✅ Hash atualizado. {len(novos)} lead(s) entraram na fila.")
    
    elif opcao == "--adicionar":
        if len(sys.argv) < 3:
            print("❌ Use: python onboard_novo_lead.py --adicionar 'Nome,email,estado'")
            sys.exit(1)
        dados = sys.argv[2].split(",")
        nome = dados[0].strip()
        email = dados[1].strip()
        estado = dados[2].strip() if len(dados) > 2 else ""
        # Verifica duplicata
        with open(CONTATOS_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("email", "").strip().lower() == email.lower():
                    print(f"⚠️ Lead já existe: {email}")
                    sys.exit(1)
        with open(CONTATOS_CSV, "a", encoding="utf-8") as f:
            f.write(f"\n{nome},,{email},,{estado}")
        print(f"✅ Lead adicionado: {nome} <{email}>")
        # Só criar status (envio é diário)
        status = {
            "nome": nome,
            "email": email.lower(),
            "campanha_26": {},
            "onboarding": {},
            "contador_26": 0,
            "contador_onb": 0,
            "criado_em": datetime.now().isoformat(),
            "ultimo_envio": None,
            "completo_26": False,
            "completo_onb": False,
            "proximo_dia_26": 1,
            "indice_onb": 0,
            "data_inicio": datetime.now().isoformat()
        }
        with open(status_path(email.lower()), "w") as f:
            json.dump(status, f, indent=2, ensure_ascii=False)
        print(f"   Status criado — entra na fila diária")
        atualizar_hash()
    
    elif opcao == "--fila":
        novos = verificar_novos()
        if novos:
            print(f"\n📋 Fila: {len(novos)} lead(s)")
            for n in novos:
                print(f"   - {n['nome']} <{n['email']}>")
        else:
            print("✅ Fila vazia.")
    
    elif opcao == "--status":
        email = sys.argv[2] if len(sys.argv) > 2 else None
        if email:
            d = ler_status(email)
            if d:
                print(json.dumps(d, ensure_ascii=False, indent=2))
                return
            print(f"❌ Sem status para: {email}")
            return
        # Sumário geral
        arquivos = [f for f in os.listdir(STATUS_DIR) if f.endswith(".json") and not f.startswith("_")]
        total = len(arquivos)
        print(f"\n📊 {total} leads com status:")
        for f in sorted(arquivos)[:20]:
            with open(os.path.join(STATUS_DIR, f), encoding="utf-8") as fh:
                d = json.load(fh)
            c26 = len(d.get("campanha_26", {}))
            onb = len(d.get("onboarding", {}))
            print(f"   - {d.get('email','?')}: 26D={c26}/26, Onb={onb}/8")
        if total > 20:
            print(f"   ... e mais {total - 20}")
    
    elif opcao == "--hash":
        print(f"Hash atual: {_hash_csv()[:16]}...")
        print(f"Hash salvo: ", end="")
        if os.path.exists(HASH_FILE):
            with open(HASH_FILE) as f:
                print(f"{f.read().strip()[:16]}...")
        else:
            print("(nenhum)")
        contatos = carregar_contatos()
        com_status = sum(1 for c in contatos if os.path.exists(status_path(c["email"])))
        print(f"Contatos no CSV: {len(contatos)} | Com status: {com_status} | Pendentes: {len(contatos) - com_status}")
    
    else:
        print(f"❌ Opção desconhecida: {opcao}")
        print(__doc__)


if __name__ == "__main__":
    main()
