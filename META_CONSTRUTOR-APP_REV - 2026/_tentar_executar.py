#!/usr/bin/env python3
"""Tenta executar o sender usando subprocess no Python disponível."""
import subprocess
import sys
import os

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(BASE, "_executar_dia1_batch.py")
out_file = os.path.join(BASE, "_send_output.txt")

os.chdir(BASE)

# Try python from PATH
python = "python"
try:
    result = subprocess.run(
        [python, script],
        capture_output=True,
        text=True,
        timeout=600
    )
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(f"Python: {python}\nReturn code: {result.returncode}\n\n=== STDOUT ===\n")
        f.write(result.stdout)
        if result.stderr:
            f.write("\n=== STDERR ===\n")
            f.write(result.stderr)
    print(f"OK! rc={result.returncode}")
    print(result.stdout[-2000:])
except Exception as e:
    print(f"Falhou: {e}")
    # Try sys.executable
    try:
        result = subprocess.run(
            [sys.executable, script],
            capture_output=True,
            text=True,
            timeout=600
        )
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Python: {sys.executable}\nReturn code: {result.returncode}\n\n=== STDOUT ===\n")
            f.write(result.stdout)
            if result.stderr:
                f.write("\n=== STDERR ===\n")
                f.write(result.stderr)
        print(f"OK (sys.executable)! rc={result.returncode}")
        print(result.stdout[-2000:])
    except Exception as e2:
        print(f"Também falhou: {e2}")
