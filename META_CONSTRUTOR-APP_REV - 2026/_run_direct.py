#!/usr/bin/env python3
"""
EXECUTA DIRETO: usa runpy para executar o script de envio.
Este é o método mais confiável no ambiente Hermes.
"""
import sys, os, io
from contextlib import redirect_stdout

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
script = os.path.join(BASE, "_executar_dia1_batch.py")
out_file = os.path.join(BASE, "_send_output.txt")

os.chdir(BASE)
sys.path.insert(0, BASE)

import runpy

capture = io.StringIO()
with redirect_stdout(capture):
    try:
        runpy.run_path(script, run_name="__main__")
    except SystemExit:
        pass
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()

output = capture.getvalue()
with open(out_file, "w", encoding="utf-8") as f:
    f.write(output)

print(output, end="")
