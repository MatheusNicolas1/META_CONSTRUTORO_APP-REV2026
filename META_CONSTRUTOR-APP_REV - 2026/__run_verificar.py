"""Helper to run onboard_novo_lead.py --verificar"""
import sys
sys.path.insert(0, r"C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026")

# Monkey-patch sys.argv to simulate --verificar
import sys
sys.argv = ['onboard_novo_lead.py', '--verificar']

from onboard_novo_lead import main
main()
