-- Migration: Fix Role Assignment & Safe Fallbacks
-- Purpose:
-- 1. Force 'Administrador' role even if user was already added as 'Colaborador' (by another trigger).
-- 2. Maintain the SAFE MODE exception handling but with smarter conflict resolution.

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
  RAISE LOG 'Handling new user (FIXED ROLE MODE): %', NEW.id;

  -- ==============================================================================
  -- BLOCK 1: Profile (MANDATORY)
  -- ==============================================================================
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'CRITICAL ERROR creating Profile for user %: %', NEW.id, SQLERRM;
  END;

  -- ==============================================================================
  -- BLOCK 2: Organization (MANDATORY)
  -- ==============================================================================
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'CRITICAL ERROR creating Org for user %: %', NEW.id, SQLERRM;
  END;
  
  -- ==============================================================================
  -- BLOCK 3: Org Member (THE FIX)
  -- ==============================================================================
  -- Change: ON CONFLICT DO UPDATE SET role = 'Administrador'
  IF v_org_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.org_members (
          org_id, user_id, role, status, joined_at, created_at, updated_at
        )
        VALUES (
          v_org_id,
          NEW.id,
          'Administrador'::app_role,
          'active',
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (org_id, user_id) 
        DO UPDATE SET 
            role = 'Administrador'::app_role,
            status = 'active';
            
      EXCEPTION WHEN OTHERS THEN
          RAISE LOG 'NON-CRITICAL ERROR adding Membro for user %: %', NEW.id, SQLERRM;
      END;
  END IF;

  -- ==============================================================================
  -- BLOCK 4: Legacy User Roles (THE FIX)
  -- ==============================================================================
  BEGIN
      INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
      VALUES (NEW.id, 'Administrador'::app_role, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET role = 'Administrador'::app_role;
  EXCEPTION WHEN OTHERS THEN
       RAISE LOG 'NON-CRITICAL ERROR adding User Role for user %: %', NEW.id, SQLERRM;
  END;

  -- ==============================================================================
  -- BLOCK 5: User Settings & Credits (SAFE)
  -- ==============================================================================
  BEGIN
      INSERT INTO public.user_settings (user_id, created_at, updated_at) 
      VALUES (NEW.id, NOW(), NOW()) 
      ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
       RAISE LOG 'NON-CRITICAL ERROR adding Settings for user %: %', NEW.id, SQLERRM;
  END;
  
  BEGIN
      INSERT INTO public.user_credits (user_id, credits_balance, plan_type, created_at, updated_at) 
      VALUES (NEW.id, 7, COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'), NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
       RAISE LOG 'NON-CRITICAL ERROR adding Credits for user %: %', NEW.id, SQLERRM;
  END;

  RAISE LOG 'User % processed (FIXED MODE). Org: %', NEW.id, v_org_id;

  RETURN NEW;
END;
$$;
