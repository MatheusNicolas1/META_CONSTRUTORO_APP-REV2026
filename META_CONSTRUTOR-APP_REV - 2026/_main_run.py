"""Execute onboard_novo_lead.py and capture output."""
import subprocess
import sys
import os

DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(DIR)

SCRIPT = os.path.join(DIR, "onboard_novo_lead.py")

print("=" * 70)
print(f"ONBOARD NOVO LEAD - VERIFICACAO")
print(f"Data: 2026-06-08  Cron: YES")
print("=" * 70)
sys.stdout.flush()

# 1. Verificar
result = subprocess.run(
    [sys.executable, SCRIPT, "--verificar"],
    capture_output=True, text=True, timeout=120
)
print(result.stdout)
if result.stderr:
    print(f"[STDERR]\n{result.stderr}")
sys.stdout.flush()

# 2. Se novos leads detectados
if "novo(s) lead(s) detectado(s)" in result.stdout.lower():
    print(">>> NOVOS LEADS DETECTADOS - Processando...")
    sys.stdout.flush()
    result2 = subprocess.run(
        [sys.executable, SCRIPT, "--processar"],
        capture_output=True, text=True, timeout=600
    )
    print(result2.stdout)
    if result2.stderr:
        print(f"[STDERR (processar)]\n{result2.stderr}")
else:
    print(">>> NENHUM NOVO LEAD detectado.")

# 3. Hash atual
print("\n--- HASH ATUAL ---")
try:
    h = subprocess.run([sys.executable, SCRIPT, "--hash"], capture_output=True, text=True, timeout=30)
    print(h.stdout)
except:
    pass

# 4. Status
print("--- STATUS ---")
try:
    s = subprocess.run([sys.executable, SCRIPT, "--status"], capture_output=True, text=True, timeout=30)
    print(s.stdout)
except:
    pass
