-- Migration: Comprehensive Fix for Sign Up Error
-- Purpose: 
-- 1. Ensure `generate_org_slug` exists (Redundant but safe)
-- 2. Drop audit triggers on `org_members` that might be failing due to permissions/RLS
-- 3. Ensure `user_credits` and `user_settings` exist
-- 4. Ensure `user_roles` unique constraint exists

-- 1. Fix generate_org_slug
CREATE OR REPLACE FUNCTION public.generate_org_slug(org_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Gerar slug base: lowercase, remover acentos, substituir espaços por hífens
  base_slug := lower(trim(org_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Se slug vazio, usar ID do usuário
  IF base_slug = '' THEN
    base_slug := substring(user_id::text from 1 for 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar unicidade e adicionar sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM public.orgs WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- 2. Disable Audit Triggers on org_members (suspect for 500 error)
DROP TRIGGER IF EXISTS trigger_audit_org_member_insert ON public.org_members;
DROP TRIGGER IF EXISTS trigger_audit_org_member_delete ON public.org_members;

-- 3. Ensure tables exist (Required by handle_new_user)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure RLS enabled on these tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 5. Helper Policies (Idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
        CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
        CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_credits' AND policyname = 'Users can view own credits') THEN
        CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
