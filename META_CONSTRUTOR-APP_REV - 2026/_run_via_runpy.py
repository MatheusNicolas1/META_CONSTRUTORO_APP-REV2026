#!/usr/bin/env python3
"""Run sender using runpy to execute it as __main__."""
import runpy
import sys
import os
import io
from contextlib import redirect_stdout

os.chdir(r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")
sys.path.insert(0, os.getcwd())

output_file = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\_send_output.txt"

capture = io.StringIO()
with redirect_stdout(capture):
    try:
        runpy.run_path("_send_dia1_full.py", run_name="__main__")
    except SystemExit:
        pass
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

output = capture.getvalue()

# Write to file
with open(output_file, "w", encoding="utf-8") as f:
    f.write(output)

print(output)
print("=== END OF OUTPUT ===")
