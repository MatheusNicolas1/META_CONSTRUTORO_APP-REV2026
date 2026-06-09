#!/usr/bin/env python3
"""Execute sender and capture results, then print them."""
import subprocess
import sys
import os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")
script = os.path.abspath("_send_dia1_full.py")

python = sys.executable
print(f"Python: {python}")
print(f"Script: {script}")

result = subprocess.run([python, script], capture_output=True, text=True, timeout=600)
print(f"Return code: {result.returncode}")
print("=== STDOUT ===")
print(result.stdout)
if result.stderr:
    print("=== STDERR ===")
    print(result.stderr)
