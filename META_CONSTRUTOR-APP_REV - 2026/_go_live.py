#!/usr/bin/env python3
"""Executa o sender via subprocess neste ambiente Hermes."""
import subprocess
import sys
import os

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
sender = os.path.join(BASE, "_enviar_agora.py")
out_file = os.path.join(BASE, "_send_output.txt")

os.chdir(BASE)

# Use the same python that's running us
python = sys.executable
print(f"sys.executable = {python}")

if python and os.path.exists(python):
    try:
        result = subprocess.run(
            [python, "-u", sender],
            capture_output=True,
            text=True,
            timeout=600
        )
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Python: {python}\nRC: {result.returncode}\n\nSTDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}")
        print(f"RC: {result.returncode}")
        print(result.stdout[-3000:])
        if result.stderr:
            print(f"STDERR (last 500): {result.stderr[-500:]}")
    except Exception as e:
        print(f"Subprocess error: {e}")
else:
    print(f"sys.executable not found/available: {python}")
    # Try 'python' from PATH
    try:
        result = subprocess.run(
            ["python", "-u", sender],
            capture_output=True,
            text=True,
            timeout=600
        )
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Python: python\nRC: {result.returncode}\n\nSTDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}")
        print(f"RC: {result.returncode}")
        print(result.stdout[-3000:])
    except Exception as e:
        print(f"python from PATH also failed: {e}")
