#!/usr/bin/env python3
"""Executa o envio via subprocess e retorna o resultado."""
import subprocess, sys, os

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

script = os.path.abspath("_run_via_runpy.py")
out_file = os.path.abspath("_send_output.txt")

# Try system python first
for py_cmd in ["python", "python3", sys.executable]:
    if py_cmd is None:
        continue
    try:
        r = subprocess.run([py_cmd, script], capture_output=True, text=True, timeout=600)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"cmd={py_cmd}\nrc={r.returncode}\n\nSTDOUT:\n{r.stdout}\n\nSTDERR:\n{r.stderr}")
        print(f"OK: {py_cmd} rc={r.returncode}")
        print(r.stdout[-1500:])
        break
    except FileNotFoundError:
        print(f"  {py_cmd}: not found")
    except Exception as e:
        print(f"  {py_cmd}: {e}")
else:
    print("NO PYTHON WORKS")
