"""
Importa contatos_master_atualizado.csv para a tabela leads_prospeccao no Supabase.
Usa a API REST diretamente (service_role key do Supabase).
"""
import csv
import json
import urllib.request
import os
import sys
import time

SUPABASE_URL = "https://bgdvlhttyjeuprrfxgun.supabase.co"

# Lê a service_role key do .env ou pede pro usuário
def get_service_key():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    # Fallback: tenta ler de variavel de ambiente
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    print("❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env nem em variável de ambiente")
    print("   Adicione SUPABASE_SERVICE_ROLE_KEY=... ao .env ou exporte a variável")
    sys.exit(1)

def importar_csv(csv_path):
    service_key = get_service_key()
    
    # Carrega contatos
    contatos = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get("email", "").strip()
            if not email:
                continue
            contatos.append({
                "nome": row.get("nome", "").strip(),
                "site": row.get("site", "").strip(),
                "email": email.lower(),
                "telefone": row.get("telefone", "").strip(),
                "estado": row.get("estado", "").strip(),
                "cidade": row.get("cidade", "").strip() or "",
                "origem": row.get("origem", "base_original").strip()
            })
    
    print(f"📋 {len(contatos)} contatos com email encontrados")
    
    # Divide em lotes de 100
    BATCH_SIZE = 100
    sucessos = 0
    erros = 0
    
    for i in range(0, len(contatos), BATCH_SIZE):
        batch = contatos[i:i+BATCH_SIZE]
        payload = json.dumps(batch).encode("utf-8")
        
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/leads_prospeccao",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Prefer": "resolution=merge-duplicates"
            },
            method="POST"
        )
        
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            status = resp.getcode()
            if status in (200, 201):
                sucessos += len(batch)
                print(f"  ✅ Lote {i//BATCH_SIZE + 1}: {len(batch)} inseridos ({sucessos}/{len(contatos)})")
            else:
                erros += len(batch)
                print(f"  ⚠️ Lote {i//BATCH_SIZE + 1}: status {status} ({resp.read().decode()[:100]})")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            # Pode ser duplicata — tenta upsert
            if "duplicate" in body.lower():
                sucessos += len(batch)
                print(f"  ⚠️ Lote {i//BATCH_SIZE + 1}: duplicatas (já existe? {len(batch)} ignorados)")
            else:
                erros += len(batch)
                print(f"  ❌ Lote {i//BATCH_SIZE + 1}: HTTP {e.code} — {body[:200]}")
        except Exception as e:
            erros += len(batch)
            print(f"  ❌ Lote {i//BATCH_SIZE + 1}: erro {e}")
        
        time.sleep(0.3)
    
    print(f"\n📊 Resultado: {sucessos} inseridos ✅ / {erros} erros ❌")
    return sucessos, erros

if __name__ == "__main__":
    csv_path = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\contatos_master_atualizado.csv"
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    
    importar_csv(csv_path)
