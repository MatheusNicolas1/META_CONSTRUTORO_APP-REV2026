@echo off
REM supabase-diff.bat — Verifica drift entre migrações locais e banco remoto do Supabase
REM Uso: scripts\supabase-diff.bat
REM Requer: npx.cmd, supabase CLI, linked project

setlocal enabledelayedexpansion

echo ==============================================
echo  [🔍] Supabase Diff: Local vs Remoto
echo ==============================================
echo.

REM ── 1. Executa supabase db diff --linked ──────────────────────────────
echo [1/3] Executando supabase db diff --linked...
echo.

set DIFF_OUTPUT=
for /f "delims=" %%a in ('npx.cmd supabase db diff --linked 2^>^&1') do (
  set "DIFF_OUTPUT=!DIFF_OUTPUT!%%a" & echo %%a
)

echo !DIFF_OUTPUT! | findstr /I /C:"no changes" /C:"nothing to change" /C:"No changes found" /C:"synchronized" /C:"No difference" >nul
if %errorlevel% equ 0 (
  set DRIFT_FOUND=false
) else (
  echo !DIFF_OUTPUT! | findstr /I /C:"Error" /C:"error" /C:"Could not connect" >nul
  if !errorlevel! equ 0 (
    set DRIFT_FOUND=unknown
  ) else (
    set DRIFT_FOUND=true
  )
)

echo.

REM ── 2. Lista migrações locais ──────────────────────────────────────────
echo [2/3] Migrações locais aplicadas:
echo.

set COUNT=0
for %%f in (supabase\migrations\*.sql) do set /a COUNT+=1 & echo    [📄] %%~nxf
echo   Total: %COUNT% migracoes
echo.

REM ── 3. Verifica schema remoto ──────────────────────────────────────────
echo [3/3] Verificando schema remoto...
echo.

npx.cmd supabase db dump --data-only --schema public >nul 2>&1
if %errorlevel% equ 0 (
  echo   [✅] Conexao remota OK
) else (
  echo   [⚠️] Nao foi possivel inspecionar schema remoto
)
echo.

echo ==============================================

REM ── 4. Diagnóstico final ──────────────────────────────────────────────
if "%DRIFT_FOUND%"=="false" (
  echo  [✅] Local e remoto sincronizados
  echo       Nenhuma diferenca detectada entre migracoes locais e banco remoto.
)
if "%DRIFT_FOUND%"=="true" (
  echo  [⚠️] Drift detectado:
  echo       Ha diferencas entre o schema local e o banco remoto.
  echo       Execute 'npx supabase db diff --linked' para ver detalhes.
)
if "%DRIFT_FOUND%"=="unknown" (
  echo  [⚠️] Estado desconhecido — verifique o erro acima.
)

echo ==============================================

endlocal
