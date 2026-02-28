-- Migration: Debug Handle New User (Isolation)
-- Purpose: Simplify handle_new_user to identifying the crashing step.
-- We will comment out steps 3, 4, and 5 to see if the error persists.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_referral_code text;
BEGIN
  RAISE LOG 'Handling new user (DEBUG MODE): %', NEW.id;

  -- 1. Create Profile (KEEP THIS - Mandatory)
  v_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  
  INSERT INTO public.profiles (
    id, name, email, phone, cpf_cnpj, plan_type, referral_code, created_at, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'cpf_cnpj',
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'),
    v_referral_code,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Create Personal Organization (KEEP THIS - Core functionality)
  INSERT INTO public.orgs (
    name, slug, owner_user_id, created_at, updated_at
  )
  VALUES (
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'My Organization'),
    public.generate_org_slug(COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'My-Org'), NEW.id),
    NEW.id,
    NOW(),
    NOW()
  ) 
  RETURNING id INTO v_org_id;
  
  -- 3. Create Org Member (COMMENTED OUT FOR DEBUGGING)
  -- IF v_org_id IS NOT NULL THEN
  --   INSERT INTO public.org_members (
  --     org_id, user_id, role, status, joined_at, created_at, updated_at
  --   )
  --   VALUES (
  --     v_org_id,
  --     NEW.id,
  --     'Administrador'::app_role,
  --     'active',
  --     NOW(),
  --     NOW(),
  --     NOW()
  --   )
  --   ON CONFLICT (org_id, user_id) DO NOTHING;
  -- END IF;

  -- 4. Legacy User Roles (COMMENTED OUT FOR DEBUGGING)
  -- INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  -- VALUES (NEW.id, 'Administrador'::app_role, NOW(), NOW())
  -- ON CONFLICT (user_id) DO UPDATE SET role = 'Administrador'::app_role;

  -- 5. User Settings & Credits (COMMENTED OUT FOR DEBUGGING)
  -- INSERT INTO public.user_settings (user_id, created_at, updated_at) 
  -- VALUES (NEW.id, NOW(), NOW()) 
  -- ON CONFLICT (user_id) DO NOTHING;
  
  -- INSERT INTO public.user_credits (user_id, credits_balance, plan_type, created_at, updated_at) 
  -- VALUES (NEW.id, 7, COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'), NOW(), NOW())
  -- ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'User % processed successfully (DEBUG MODE). Org: %', NEW.id, v_org_id;

  RETURN NEW;
END;
$$;
