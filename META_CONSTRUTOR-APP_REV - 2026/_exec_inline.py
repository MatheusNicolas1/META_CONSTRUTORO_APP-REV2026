#!/usr/bin/env python3
"""
Executor que roda o sender INLINE (sem subprocess) capturando toda saída.
"""
import sys, os, io
from contextlib import redirect_stdout

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(BASE)

# Read the sender script
with open("_enviar_agora.py", "r", encoding="utf-8") as f:
    code = f.read()

# Create namespace
namespace = {
    "__name__": "__main__",
    "__file__": os.path.join(BASE, "_enviar_agora.py"),
}

# Capture output
capture = io.StringIO()
with redirect_stdout(capture):
    try:
        exec(code, namespace)
    except SystemExit:
        pass
    except Exception as e:
        import traceback
        print(f"ERRO: {e}")
        traceback.print_exc()

output = capture.getvalue()

# Write to file
with open("_send_output.txt", "w", encoding="utf-8") as f:
    f.write(output)

# Print for immediate visibility
print(output)
