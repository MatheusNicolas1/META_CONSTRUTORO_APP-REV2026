#!/usr/bin/env python3
"""
Único script que tenta executar o sender de todas as formas possíveis.
"""
import subprocess, sys, os, io, runpy
from contextlib import redirect_stdout

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
sender = os.path.join(BASE, "_enviar_agora.py")
out_file = os.path.join(BASE, "_send_output.txt")
os.chdir(BASE)

output = None

# Try 1: subprocess with python
for py in ["python", "python3", sys.executable]:
    if not py: continue
    try:
        r = subprocess.run([py, sender], capture_output=True, text=True, timeout=600)
        output = f"METHOD: subprocess({py})\nRC: {r.returncode}\n\nSTDOUT:\n{r.stdout}\n\nSTDERR:\n{r.stderr}"
        break
    except:
        continue

# Try 2: runpy
if output is None:
    try:
        capture = io.StringIO()
        with redirect_stdout(capture):
            runpy.run_path(sender, run_name="__main__")
        output = f"METHOD: runpy\n\nSTDOUT:\n{capture.getvalue()}"
    except SystemExit:
        output = f"METHOD: runpy\n\nSTDOUT:\n{capture.getvalue()}"
    except Exception as e:
        output = f"METHOD: runpy\nERROR: {e}"

# Try 3: exec
if output is None:
    try:
        with open(sender, "r") as f:
            code = f.read()
        exec_globals = {"__name__": "__main__", "__file__": sender}
        exec_globals.update(globals())
        capture = io.StringIO()
        with redirect_stdout(capture):
            exec(code, exec_globals)
        output = f"METHOD: exec\n\nSTDOUT:\n{capture.getvalue()}"
    except SystemExit:
        output = f"METHOD: exec\n\nSTDOUT:\n{capture.getvalue()}"
    except Exception as e:
        output = f"METHOD: exec\nERROR: {e}"

# Write result
if output:
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(output)
    print(output[-3000:])
else:
    print("COMPLETELY FAILED TO EXECUTE")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("COMPLETELY FAILED TO EXECUTE")
