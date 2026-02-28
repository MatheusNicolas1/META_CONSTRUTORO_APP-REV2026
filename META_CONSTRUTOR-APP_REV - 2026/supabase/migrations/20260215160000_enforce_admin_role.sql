-- Migration: Enforce Admin Role for Owners
-- Purpose:
-- 1. Create a TRIGGER on org_members that fires BEFORE INSERT/UPDATE.
-- 2. Check if the user is the OWNER of the organization.
-- 3. If yes, FORCE the role to be 'Administrador'.
-- 4. This guarantees that no matter what other triggers do, the owner is ALWAYS Admin.

CREATE OR REPLACE FUNCTION public.enforce_owner_is_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the user being added/updated is the owner of the org
  IF EXISTS (
    SELECT 1 FROM public.orgs 
    WHERE id = NEW.org_id 
    AND owner_user_id = NEW.user_id
  ) THEN
    -- Force Admin role
    NEW.role := 'Administrador'::app_role;
    RAISE LOG 'Enforced Admin role for Org Owner: % (Org: %)', NEW.user_id, NEW.org_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS trigger_enforce_owner_admin ON public.org_members;

-- Create the trigger
CREATE TRIGGER trigger_enforce_owner_admin
  BEFORE INSERT OR UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_owner_is_admin();

-- Also, let's clean up any "Colaborador" owners that might exist now
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT om.org_id, om.user_id 
    FROM public.org_members om
    JOIN public.orgs o ON o.id = om.org_id
    WHERE o.owner_user_id = om.user_id 
    AND om.role != 'Administrador'::app_role
  LOOP
    UPDATE public.org_members 
    SET role = 'Administrador'::app_role 
    WHERE org_id = r.org_id AND user_id = r.user_id;
  END LOOP;
END $$;
