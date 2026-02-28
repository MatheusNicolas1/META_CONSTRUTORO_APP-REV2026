-- ============================================================================
-- FIX: PERMISSÕES DO SHEMA DE MIGRAÇÕES
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. Garantir que o role 'postgres' tem acesso ao schema de histórico de migrações
GRANT USAGE ON SCHEMA supabase_migrations TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA supabase_migrations TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA supabase_migrations TO postgres;

-- 2. Garantir que o role 'postgres' tem acesso total ao schema public
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 3. Garantir que o role 'postgres' é dono das tabelas críticas (se possível)
-- Isso evita erro de "must be owner" em comandos futuros
ALTER TABLE IF EXISTS public.plans OWNER TO postgres;
ALTER TABLE IF EXISTS public.subscriptions OWNER TO postgres;
ALTER TABLE IF EXISTS public.stripe_events OWNER TO postgres;

-- 4. Confirmação
SELECT 'Permissões corrigidas com sucesso' as status;
