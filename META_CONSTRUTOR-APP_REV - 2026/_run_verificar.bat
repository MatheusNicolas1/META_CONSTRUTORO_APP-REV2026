@echo off
cd /d "C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
echo Running verification...
python onboard_novo_lead.py --verificar
echo.
echo Exit code: %ERRORLEVEL%
pause
