ECHO Running Day 1 email campaign script...
cd /d "C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
python enviar_dia1.py
IF %ERRORLEVEL% EQU 0 (
    ECHO All 50 emails sent successfully!
) ELSE (
    ECHO Some emails failed - check relatorio_dia1.txt for details
)
EXIT /B %ERRORLEVEL%
