# Deploy to Supabase Cloud (Run this in PowerShell)

Write-Host "Iniciando deploy completo para Supabase Cloud..."

# 1. Login (caso não esteja logado)
# npx supabase login

# 2. Linkar projeto (garantir que está ligado ao remoto)
# npx supabase link --project-ref bgdvlhttyjeuprrfxgun

# 3. Deploy de todas as Edge Functions
Write-Host "Deploying Edge Functions..."
npx supabase functions deploy --no-verify-jwt

# 4. Enviar migrações de banco de dados (Schema)
Write-Host "Pushing Database Migrations..."
npx supabase db push

Write-Host "Concluído! Agora você pode parar o Docker Desktop e testar a aplicação."
