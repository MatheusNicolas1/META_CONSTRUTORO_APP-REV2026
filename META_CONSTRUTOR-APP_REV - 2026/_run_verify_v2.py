"""Execute onboard_novo_lead.py --verificar by importing the module directly."""
import sys
import os
import importlib.util

# Set up paths
script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(script_dir)

# Load the module from file path
spec = importlib.util.spec_from_file_location("onboard_novo_lead", os.path.join(script_dir, "onboard_novo_lead.py"))
mod = importlib.util.module_from_spec(spec)

# Set argv before loading
sys.argv = ["onboard_novo_lead.py", "--verificar"]

spec.loader.exec_module(mod)
