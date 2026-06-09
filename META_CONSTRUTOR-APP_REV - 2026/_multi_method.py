#!/usr/bin/env python3
"""
EXECUTOR QUE TENTA SUBPROCESS NO AMBIENTE HERMES.
Se falhar, tenta runpy. Se falhar, tenta exec direto.
"""
import sys, os, subprocess

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(BASE, "_executar_dia1_batch.py")
out_file = os.path.join(BASE, "_send_output.txt")

os.chdir(BASE)

# Method 1: subprocess
print("=== Method 1: subprocess ===")
for cmd in ["python", "python3", sys.executable]:
    if not cmd:
        continue
    try:
        r = subprocess.run([cmd, script], capture_output=True, text=True, timeout=600)
        with open(out_file, "w") as f:
            f.write(f"Method: subprocess({cmd})\nrc={r.returncode}\n\nSTDOUT:\n{r.stdout}\n\nSTDERR:\n{r.stderr}")
        print(f"OK with {cmd}")
        print(r.stdout[-3000:])
        sys.exit(0)
    except FileNotFoundError:
        continue
    except Exception as e:
        print(f"  {cmd}: {e}")

print("subprocess failed for all")

# Method 2: runpy
print("\n=== Method 2: runpy ===")
import runpy
import io
from contextlib import redirect_stdout

capture = io.StringIO()
with redirect_stdout(capture):
    try:
        runpy.run_path(script, run_name="__main__")
    except SystemExit:
        pass
    except Exception as e:
        print(f"runpy error: {e}")
        import traceback
        traceback.print_exc()

output = capture.getvalue()
with open(out_file, "w") as f:
    f.write(f"Method: runpy\n\n{output}")
print("runpy output:")
print(output[-3000:])
