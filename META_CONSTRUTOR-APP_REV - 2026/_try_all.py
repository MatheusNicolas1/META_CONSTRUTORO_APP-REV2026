#!/usr/bin/env python3
"""
EXECUTA O ENVIO INLINE USANDO SUBPROCESS.
"""
import subprocess, sys, os

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(BASE, "_enviar_agora.py")
out_file = os.path.join(BASE, "_send_output.txt")
os.chdir(BASE)

# Try multiple python commands
for py in ["python", "python3", sys.executable]:
    if not py:
        continue
    try:
        p = subprocess.run([py, "-u", script], capture_output=True, text=True, timeout=600)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Python: {py}\nRC: {p.returncode}\n\nSTDOUT:\n{p.stdout}\n\nSTDERR:\n{p.stderr}")
        print(f"DONE with {py}, rc={p.returncode}")
        print(p.stdout[-2000:])
        sys.exit(0)
    except FileNotFoundError:
        continue
    except subprocess.TimeoutExpired:
        print(f"Timeout with {py}")
        continue
    except Exception as e:
        print(f"Error with {py}: {e}")
        continue

print("ALL METHODS FAILED")
