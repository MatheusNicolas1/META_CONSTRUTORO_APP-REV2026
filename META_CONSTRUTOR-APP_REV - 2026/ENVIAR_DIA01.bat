@echo off
echo ============================================================
echo Dia 1 - Campanha de 26 E-mails - Meta Construtor
echo Enviando para contatos 50-99 do CSV
echo Subject: Acabe com o RDO perdido no WhatsApp -- Meta Construtor
echo ============================================================
cd /d "C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026"
python campanha-26-dias\dia01_send.py
echo.
echo Script concluido. Verifique dia01_resultado.txt para o log.
pause
