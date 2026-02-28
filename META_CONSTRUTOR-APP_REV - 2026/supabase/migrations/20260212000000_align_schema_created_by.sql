-- M1: Alignment of 'user_id' -> 'created_by' as per PRD2
-- This migration renames the column to match the canonical contract without losing data.

-- 1. Obras
ALTER TABLE public.obras RENAME COLUMN user_id TO created_by;

-- 2. RDOs
ALTER TABLE public.rdos RENAME COLUMN user_id TO created_by;

-- 3. Equipes
ALTER TABLE public.equipes RENAME COLUMN user_id TO created_by;

-- 4. Fornecedores
ALTER TABLE public.fornecedores RENAME COLUMN user_id TO created_by;

-- 5. Equipamentos
ALTER TABLE public.equipamentos RENAME COLUMN user_id TO created_by;

-- 6. Helper Function: is_org_member (Contract Requirement)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$;

-- 7. Helper Function: has_org_role (Contract Requirement)
CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id uuid, p_roles app_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role = ANY(p_roles)
  );
END;
$$;
