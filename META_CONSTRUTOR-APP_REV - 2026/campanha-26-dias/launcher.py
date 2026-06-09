import sys, os, subprocess

script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-26-dias\run.py"
cwd = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"

result = subprocess.run(
    [sys.executable, script],
    capture_output=True, text=True, timeout=300, cwd=cwd
)
print("OUTPUT:")
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:1000])
print(f"RC={result.returncode}")
