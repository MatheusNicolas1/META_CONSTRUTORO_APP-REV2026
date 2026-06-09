#!/usr/bin/env python3
"""Final attempt - execute sender via subprocess directly."""
import subprocess
import sys
import os

script = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_dia1_full.py"
out_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# The prompt says python=3.11.15 is available
result = subprocess.run(
    ["python", script],
    capture_output=True,
    text=True,
    timeout=600
)

with open(out_file, "w", encoding="utf-8") as f:
    f.write(f"Return code: {result.returncode}\n\n=== STDOUT ===\n")
    f.write(result.stdout)
    if result.stderr:
        f.write("\n=== STDERR ===\n")
        f.write(result.stderr)

print(f"rc={result.returncode}, stdout={len(result.stdout)}c, stderr={len(result.stderr)}c")
print(result.stdout[-1000:])
