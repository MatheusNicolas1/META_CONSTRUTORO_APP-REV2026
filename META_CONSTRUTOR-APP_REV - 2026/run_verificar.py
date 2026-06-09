## script to run --verificar
import sys
import os

os.chdir(r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026')
sys.argv = ['onboard_novo_lead.py', '--verificar']

exec(open('onboard_novo_lead.py').read())
