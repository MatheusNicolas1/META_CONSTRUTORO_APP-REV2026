"""Execute onboard_novo_lead.py --verificar by importing it."""
import sys
import os

script_dir = r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
os.chdir(script_dir)
sys.path.insert(0, script_dir)

# Set argv to trigger --verificar
sys.argv = [sys.argv[0], "--verificar"]

# Import and run
import onboard_novo_lead
onboard_novo_lead.main()
