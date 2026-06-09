"""Execute onboard_novo_lead.py --verificar by calling main() with custom argv"""
import sys
import importlib.util

script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
spec = importlib.util.spec_from_file_location(
    "onboard_novo_lead", 
    script_dir + "\\onboard_novo_lead.py"
)
mod = importlib.util.module_from_spec(spec)

# Monkey-patch sys.argv
old_argv = sys.argv
sys.argv = ["onboard_novo_lead.py", "--verificar"]

try:
    spec.loader.exec_module(mod)
finally:
    sys.argv = old_argv
