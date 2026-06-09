import subprocess
import sys

result = subprocess.run(
    [sys.executable, r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\send_dia01_v2.py"],
    capture_output=True,
    text=True,
    timeout=300
)

print("STDOUT:")
print(result.stdout)
print("\nSTDERR:")
print(result.stderr)
print(f"\nReturn code: {result.returncode}")
