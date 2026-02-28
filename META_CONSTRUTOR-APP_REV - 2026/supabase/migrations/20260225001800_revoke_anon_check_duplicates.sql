-- ============================================================================
-- HARDENING: Endurecimento definitivo do fluxo de criação de conta
-- ============================================================================
-- V1: Revoke anon access to check_user_duplicates
-- V2: LGPD consent tracking (terms_accepted_at NOT NULL)
-- V3: Trigger à prova de falha (profile INSERT falha = aborta tudo)
-- V4: Mass assignment whitelist explícita
-- ============================================================================

-- 1. Revoke anon execute on check_user_duplicates
REVOKE EXECUTE ON FUNCTION public.check_user_duplicates(text, text, text) FROM anon;

-- 2. Revoke anon SELECT on profiles (RLS policies already handle visibility)
REVOKE SELECT ON public.profiles FROM anon;

-- 3. Add terms_accepted_at column for LGPD consent tracking (NOT NULL com default)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Add terms_accepted_ip for audit trail
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT;

-- 5. Trigger à prova de falha com whitelist de campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $function$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_org_slug TEXT;
  -- Whitelist: apenas campos permitidos do raw_user_meta_data
  v_name TEXT;
  v_phone TEXT;
  v_plan_type TEXT;
  v_terms_ts TIMESTAMPTZ;
BEGIN
  -- ================================================================
  -- MASS ASSIGNMENT PROTECTION: Extrair APENAS campos permitidos
  -- Qualquer campo extra no metadata é IGNORADO.
  -- 'role', 'status', 'is_admin' etc. são NUNCA lidos do metadata.
  -- ================================================================
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_plan_type := 'free'; -- SEMPRE 'free' no signup, independente do metadata
  v_terms_ts := COALESCE(
    (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
    now()
  );

  v_org_name := COALESCE(NULLIF(v_name, ''), 'Minha Empresa');
  v_org_slug := LOWER(REPLACE(v_org_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8);

  -- ================================================================
  -- 1. Criar profile — SE FALHAR, ABORTA TUDO (não cria user sem profile)
  -- ================================================================
  INSERT INTO public.profiles (
    id, name, email, phone, cpf_cnpj, plan_type,
    referral_code, terms_accepted_at, created_at, updated_at
  )
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_phone,
    NULL, -- cpf_cnpj nunca vem do signup
    v_plan_type,
    SUBSTRING(MD5(NEW.id::text || NOW()::text), 1, 8),
    v_terms_ts,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, profiles.terms_accepted_at),
    updated_at = NOW();
  -- SEM EXCEPTION HANDLER: se falhar, a transação toda aborta

  -- ================================================================
  -- 2. Criar organização (fallback: seguro se falhar)
  -- ================================================================
  BEGIN
    INSERT INTO public.orgs (name, slug, owner_user_id)
    VALUES (v_org_name, v_org_slug, NEW.id)
    RETURNING id INTO v_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating org for %: %', NEW.id, SQLERRM;
  END;

  -- ================================================================
  -- 3. Criar org membership (fallback: seguro se falhar)
  -- ================================================================
  IF v_org_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.org_members (org_id, user_id, role, status)
      VALUES (v_org_id, NEW.id, 'Administrador', 'active')
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: Error creating org_member for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- ================================================================
  -- 4. Criar user role (HARDCODED — nunca do metadata)
  -- ================================================================
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'Administrador')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating user_role for %: %', NEW.id, SQLERRM;
  END;

  -- ================================================================
  -- 5. Criar user settings
  -- ================================================================
  BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating user_settings for %: %', NEW.id, SQLERRM;
  END;

  -- ================================================================
  -- 6. Criar créditos iniciais (plan HARDCODED como 'free')
  -- ================================================================
  BEGIN
    INSERT INTO public.user_credits (user_id, credits_balance, plan_type)
    VALUES (NEW.id, 7, v_plan_type)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating user_credits for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
