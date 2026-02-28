-- Migration: Update Roles and Fix Policies
-- Purpose: 
-- 1. Add 'Presidente' to app_role enum
-- 2. Ensure new users are 'Administrador' by default
-- 3. Fix RLS policies for strict data isolation

-- Enum 'Presidente' added in 20260213135000_add_enum_presidente.sql

-- 2. Update handle_new_user to ensure 'Administrador' is default (It already was, but ensuring consistency)
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
  
  -- 3. Create Org Member (Default to Administrator)
  IF v_org_id IS NOT NULL THEN
    INSERT INTO public.org_members (
      org_id, user_id, role, status, joined_at, created_at, updated_at
    )
    VALUES (
      v_org_id,
      NEW.id,
      'Administrador'::app_role, -- FORCE ADMIN
      'active',
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;

  -- 4. Legacy User Roles (Sync)
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.id, 'Administrador'::app_role, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'Administrador'::app_role;

  -- 5. User Settings & Credits
  INSERT INTO public.user_settings (user_id, created_at, updated_at) 
  VALUES (NEW.id, NOW(), NOW()) 
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_credits (user_id, credits_balance, plan_type, created_at, updated_at) 
  VALUES (NEW.id, 7, COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'), NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Fix OBRAS RLS (Ensure strict isolation by user_id for now, or via Org if OrgContext is active)
-- Only allow users to see works where they are the Creator OR they are a member of the Org
DROP POLICY IF EXISTS "Obras: View" ON public.obras;
CREATE POLICY "Obras: View" ON public.obras FOR SELECT USING (
  created_by = auth.uid() 
  OR 
  (org_id IS NOT NULL AND public.is_org_member(org_id))
);

DROP POLICY IF EXISTS "Obras: Insert" ON public.obras;
CREATE POLICY "Obras: Insert" ON public.obras FOR INSERT WITH CHECK (
  auth.uid() = created_by 
  -- AND (org_id IS NULL OR public.has_org_role(org_id, ARRAY['Administrador'::app_role, 'Gerente'::app_role, 'Presidente'::app_role]))
);

DROP POLICY IF EXISTS "Obras: Update" ON public.obras;
CREATE POLICY "Obras: Update" ON public.obras FOR UPDATE USING (
  created_by = auth.uid() OR public.has_org_role(org_id, ARRAY['Administrador'::app_role, 'Gerente'::app_role, 'Presidente'::app_role])
);

DROP POLICY IF EXISTS "Obras: Delete" ON public.obras;
CREATE POLICY "Obras: Delete" ON public.obras FOR DELETE USING (
  created_by = auth.uid() OR public.has_org_role(org_id, ARRAY['Administrador'::app_role, 'Presidente'::app_role])
);

-- 4. Fix RDOS RLS
DROP POLICY IF EXISTS "RDOs: View" ON public.rdos;
CREATE POLICY "RDOs: View" ON public.rdos FOR SELECT USING (
  created_by = auth.uid() 
  OR 
  (org_id IS NOT NULL AND public.is_org_member(org_id))
);

DROP POLICY IF EXISTS "RDOs: Insert" ON public.rdos;
CREATE POLICY "RDOs: Insert" ON public.rdos FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

-- 5. Update Policies for new Role 'Presidente' to have full access (Super Admin)
-- We can add a bypass RLS policy or just ensure they pass checks.
-- For simplicity, we included 'Presidente' in the role arrays above.

-- 6. Assign Presidente Role to specific users
UPDATE public.user_roles 
SET role = 'Presidente'::app_role 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('metaconstrutor@gmail.com', 'matheusnicolas.org@gmail.com')
);

UPDATE public.org_members
SET role = 'Presidente'::app_role
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('metaconstrutor@gmail.com', 'matheusnicolas.org@gmail.com')
);
