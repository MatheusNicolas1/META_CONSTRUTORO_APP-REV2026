import sys, os, runpy, io
from contextlib import redirect_stdout

BASE = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(BASE)
sys.path.insert(0, BASE)

sender = os.path.join(BASE, "_enviar_agora.py")
out_file = os.path.join(BASE, "_send_output.txt")

capture = io.StringIO()
with redirect_stdout(capture):
    try:
        runpy.run_path(sender, run_name="__main__")
    except SystemExit:
        pass
    except Exception as e:
        import traceback
        print(f"ERRO: {e}")
        traceback.print_exc()

output = capture.getvalue()
with open(out_file, "w", encoding="utf-8") as f:
    f.write(output)
print(output)
