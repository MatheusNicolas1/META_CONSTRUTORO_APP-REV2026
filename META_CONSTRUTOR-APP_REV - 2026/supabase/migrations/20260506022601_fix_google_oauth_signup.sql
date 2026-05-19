-- Fix Google OAuth signup.
-- OAuth providers do not guarantee app-specific metadata like phone/name.
-- The previous trigger converted missing phone to '', which collides with the
-- unique profile phone index. Store NULL instead and use Google full_name/name.

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
  v_name TEXT;
  v_phone TEXT;
  v_plan_type TEXT;
  v_terms_ts TIMESTAMPTZ;
BEGIN
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.email, ''),
    'Usuario'
  );
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_plan_type := 'free';
  v_terms_ts := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
    now()
  );

  v_org_name := COALESCE(NULLIF(v_name, ''), 'Minha Empresa');
  v_org_slug := LOWER(REPLACE(v_org_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8);

  INSERT INTO public.profiles (
    id, name, email, phone, cpf_cnpj, plan_type,
    referral_code, terms_accepted_at, created_at, updated_at
  )
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_phone,
    NULL,
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

  BEGIN
    INSERT INTO public.orgs (name, slug, owner_user_id)
    VALUES (v_org_name, v_org_slug, NEW.id)
    RETURNING id INTO v_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating org for %: %', NEW.id, SQLERRM;
  END;

  IF v_org_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.org_members (org_id, user_id, role, status)
      VALUES (v_org_id, NEW.id, 'Administrador', 'active')
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: Error creating org_member for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'Administrador')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating user_role for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error creating user_settings for %: %', NEW.id, SQLERRM;
  END;

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
