"""Test if we can execute code via import mechanism"""
import subprocess, sys, os

# Try running the script via subprocess
script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\campanha-26-dias\dia01_send.py"
result = subprocess.run(
    [sys.executable, script],
    capture_output=True, text=True, timeout=300
)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:500])
print(f"RC={result.returncode}")
