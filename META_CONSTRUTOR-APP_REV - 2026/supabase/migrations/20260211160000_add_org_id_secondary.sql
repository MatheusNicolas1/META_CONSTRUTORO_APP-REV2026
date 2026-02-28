-- Add org_id to secondary tables (Equipamentos, Equipes, Fornecedores)
-- This ensures multi-tenancy consistency across the app.

BEGIN;

-- 1. EQUIPAMENTOS
ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id);

CREATE INDEX IF NOT EXISTS idx_equipamentos_org_id ON public.equipamentos(org_id);

-- Backfill Equipamentos (via user_id owner)
UPDATE public.equipamentos e
SET org_id = orgs.id
FROM public.orgs
WHERE e.user_id = orgs.owner_user_id
AND e.org_id IS NULL;

-- 2. EQUIPES (Assuming table name is 'equipes')
ALTER TABLE public.equipes 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id);

CREATE INDEX IF NOT EXISTS idx_equipes_org_id ON public.equipes(org_id);

-- Backfill Equipes
UPDATE public.equipes e
SET org_id = orgs.id
FROM public.orgs
WHERE e.user_id = orgs.owner_user_id
AND e.org_id IS NULL;

-- 3. FORNECEDORES
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id);

CREATE INDEX IF NOT EXISTS idx_fornecedores_org_id ON public.fornecedores(org_id);

-- Backfill Fornecedores
UPDATE public.fornecedores f
SET org_id = orgs.id
FROM public.orgs
WHERE f.user_id = orgs.owner_user_id
AND f.org_id IS NULL;

-- 4. Enforce constraints (Optional/Warn if fails)
-- We attempt to set NOT NULL where possible.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.equipamentos WHERE org_id IS NULL) THEN
    ALTER TABLE public.equipamentos ALTER COLUMN org_id SET NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.equipes WHERE org_id IS NULL) THEN
    ALTER TABLE public.equipes ALTER COLUMN org_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.fornecedores WHERE org_id IS NULL) THEN
    ALTER TABLE public.fornecedores ALTER COLUMN org_id SET NOT NULL;
  END IF;
END $$;

COMMIT;
