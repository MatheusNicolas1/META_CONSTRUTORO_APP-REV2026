"""Script to run onboard_novo_lead.py --verificar and --processar."""
import subprocess
import sys

PROJ_DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"

# Step 1: --verificar
print("=" * 60)
print("STEP 1: Verificando novos leads...")
print("=" * 60)
result = subprocess.run(
    [sys.executable, "onboard_novo_lead.py", "--verificar"],
    cwd=PROJ_DIR,
    capture_output=True, text=True, timeout=120
)
print(result.stdout)
if result.stderr:
    print(f"STDERR: {result.stderr}")

# Step 2: Check if there are new leads
if "novo(s) lead(s) detectado(s)" in result.stdout:
    print("\n" + "=" * 60)
    print("STEP 2: Processando novos leads...")
    print("=" * 60)
    result2 = subprocess.run(
        [sys.executable, "onboard_novo_lead.py", "--processar"],
        cwd=PROJ_DIR,
        capture_output=True, text=True, timeout=600
    )
    print(result2.stdout)
    if result2.stderr:
        print(f"STDERR: {result2.stderr}")
else:
    print("\n✅ Nenhum lead novo para processar.")
