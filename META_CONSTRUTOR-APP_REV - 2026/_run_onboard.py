"""Cron job runner: check and process new leads for Meta Construtor."""
import subprocess
import sys
import os

DIR = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(DIR, "onboard_novo_lead.py")

print("=" * 60)
print("META CONSTRUTOR - VERIFICACAO DE NOVOS LEADS (CRON)")
print(f"Data: 2026-06-08")
print("=" * 60)

# Step 1: verify
result = subprocess.run(
    [sys.executable, script, "--verificar"],
    capture_output=True, text=True, timeout=120, cwd=DIR
)
print("\n[--verificar output]")
print(result.stdout)
if result.stderr:
    print("[STDERR]", result.stderr)
print(f"[EXIT CODE: {result.returncode}]")

output_lower = result.stdout.lower()
has_new_leads = "novo(s) lead(s) detectado(s)" in output_lower

if has_new_leads:
    print("\n" + "=" * 60)
    print("NOVOS LEADS DETECTADOS! Processando automaticamente...")
    print("=" * 60)
    
    result2 = subprocess.run(
        [sys.executable, script, "--processar"],
        capture_output=True, text=True, timeout=600, cwd=DIR
    )
    print("\n[--processar output]")
    print(result2.stdout)
    if result2.stderr:
        print("[STDERR]", result2.stderr)
    print(f"[EXIT CODE: {result2.returncode}]")
else:
    print("\nNenhum lead novo para processar.")

# Final summary
print("\n" + "=" * 60)
print("STATUS ATUAL")
print("=" * 60)

result3 = subprocess.run(
    [sys.executable, script, "--hash"],
    capture_output=True, text=True, timeout=30, cwd=DIR
)
print(result3.stdout)

result4 = subprocess.run(
    [sys.executable, script, "--status"],
    capture_output=True, text=True, timeout=30, cwd=DIR
)
print(result4.stdout)

print("\n--- FIM ---")
