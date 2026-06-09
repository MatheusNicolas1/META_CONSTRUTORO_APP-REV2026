#!/usr/bin/env python3
"""Executa _enviar_agora.py via runpy e mostra resultado."""
import sys, os

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(BASE)
sys.path.insert(0, BASE)

from runpy import run_path

try:
    run_path(os.path.join(BASE, "_enviar_agora.py"), run_name="__main__")
except SystemExit:
    pass
except Exception as e:
    import traceback
    print(f"ERRO: {e}")
    traceback.print_exc()
