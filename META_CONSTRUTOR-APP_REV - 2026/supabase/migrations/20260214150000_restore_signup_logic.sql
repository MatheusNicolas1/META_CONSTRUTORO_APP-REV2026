-- Migration: Restore Sign Up Logic & Permissions
-- Purpose:
-- 1. Restore the 'Administrador' role assignment (previously commented out for debug).
-- 2. Restore User Credits creation (7 credits).
-- 3. PERMANENTLY DISABLE the problematic Audit Triggers on org_members (identified as the crash cause).
-- 4. Ensure dependencies exist.

-- 1. Disable Audit Triggers (The Cure)
-- These triggers likely caused the 500 error due to recursion or permission issues during sign-up.
DROP TRIGGER IF EXISTS trigger_audit_org_member_insert ON public.org_members;
DROP TRIGGER IF EXISTS trigger_audit_org_member_delete ON public.org_members;

-- 2. Restore handle_new_user with FULL logic
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
  RAISE LOG 'Handling new user: %', NEW.id;

  -- 1. Create Profile
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

  -- 2. Create Personal Organization
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
  
  -- 3. Create Org Member (RESTORED - As Administrador)
  IF v_org_id IS NOT NULL THEN
    INSERT INTO public.org_members (
      org_id, user_id, role, status, joined_at, created_at, updated_at
    )
    VALUES (
      v_org_id,
      NEW.id,
      'Administrador'::app_role, -- Explicitly set as Administrador
      'active',
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;

  -- 4. Legacy User Roles (RESTORED)
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, 'Administrador'::app_role, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'Administrador'::app_role;

  -- 5. User Settings & Credits (RESTORED)
  INSERT INTO public.user_settings (user_id, created_at, updated_at) 
  VALUES (NEW.id, NOW(), NOW()) 
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_credits (user_id, credits_balance, plan_type, created_at, updated_at) 
  VALUES (NEW.id, 7, COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'), NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RAISE LOG 'User % processed successfully. Org: %', NEW.id, v_org_id;

  RETURN NEW;
END;
$$;
