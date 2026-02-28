-- Migration: Fix generate_org_slug function
-- Purpose: Restore the missing helper function required by handle_new_user trigger

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
