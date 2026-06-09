import subprocess, sys, os
script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(script_dir, "onboard_novo_lead.py")
result = subprocess.run(
    [sys.executable, script, "--verificar"],
    capture_output=True, text=True, cwd=script_dir
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RC:", result.returncode)
