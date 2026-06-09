import subprocess, sys, os

script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(script_dir, "onboard_novo_lead.py")

# Use sys.executable (python 3.11) to run
result = subprocess.run(
    [sys.executable, script, "--verificar"],
    capture_output=True, text=True, cwd=script_dir,
    timeout=60
)
print("=== STDOUT ===")
print(result.stdout)
print("=== STDERR ===")
print(result.stderr)
print(f"=== RC: {result.returncode} ===")
