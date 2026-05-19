
-- ============================================================
-- Migration: Adicionar org_id em tabelas faltantes
-- Tabelas: equipamentos, equipes, fornecedores, documentos, checklists
-- ============================================================

-- 1. Adicionar coluna org_id (nullable inicialmente para backfill)
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id);
ALTER TABLE public.equipes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id);
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id);
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id);
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id);

-- 2. Backfill: derivar org_id a partir de user_id → org_members
UPDATE public.equipamentos e
SET org_id = (
  SELECT om.org_id FROM public.org_members om
  WHERE om.user_id = e.user_id AND om.status = 'active'
  LIMIT 1
)
WHERE e.org_id IS NULL;

UPDATE public.equipes eq
SET org_id = (
  SELECT om.org_id FROM public.org_members om
  WHERE om.user_id = eq.user_id AND om.status = 'active'
  LIMIT 1
)
WHERE eq.org_id IS NULL;

UPDATE public.fornecedores f
SET org_id = (
  SELECT om.org_id FROM public.org_members om
  WHERE om.user_id = f.user_id AND om.status = 'active'
  LIMIT 1
)
WHERE f.org_id IS NULL;

UPDATE public.documentos d
SET org_id = (
  SELECT om.org_id FROM public.org_members om
  WHERE om.user_id = d.uploaded_by AND om.status = 'active'
  LIMIT 1
)
WHERE d.org_id IS NULL;

UPDATE public.checklists c
SET org_id = (
  SELECT om.org_id FROM public.org_members om
  WHERE om.user_id = c.responsavel_id AND om.status = 'active'
  LIMIT 1
)
WHERE c.org_id IS NULL;

-- 3. Comentários descritivos
COMMENT ON COLUMN public.equipamentos.org_id IS 'Organização proprietária do equipamento.';
COMMENT ON COLUMN public.equipes.org_id IS 'Organização proprietária do colaborador.';
COMMENT ON COLUMN public.fornecedores.org_id IS 'Organização proprietária do fornecedor.';
COMMENT ON COLUMN public.documentos.org_id IS 'Organização proprietária do documento.';
COMMENT ON COLUMN public.checklists.org_id IS 'Organização proprietária do checklist.';

-- 4. Índices para performance em queries filtradas por org_id
CREATE INDEX IF NOT EXISTS idx_equipamentos_org_id ON public.equipamentos(org_id);
CREATE INDEX IF NOT EXISTS idx_equipes_org_id ON public.equipes(org_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_org_id ON public.fornecedores(org_id);
CREATE INDEX IF NOT EXISTS idx_documentos_org_id ON public.documentos(org_id);
CREATE INDEX IF NOT EXISTS idx_checklists_org_id ON public.checklists(org_id);

-- 5. RLS Policies para isolamento multi-tenant
-- Não apagar policies existentes (podem estar usando user_id), apenas ADICIONAR org_id policies

-- Equipamentos: READ scoped por org
DROP POLICY IF EXISTS "equipamentos_org_read" ON public.equipamentos;
CREATE POLICY "equipamentos_org_read" ON public.equipamentos
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL -- permitir registros legados sem org_id
  );

-- Equipamentos: WRITE scoped por org
DROP POLICY IF EXISTS "equipamentos_org_write" ON public.equipamentos;
CREATE POLICY "equipamentos_org_write" ON public.equipamentos
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Equipes: READ scoped por org
DROP POLICY IF EXISTS "equipes_org_read" ON public.equipes;
CREATE POLICY "equipes_org_read" ON public.equipes
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Equipes: WRITE scoped por org
DROP POLICY IF EXISTS "equipes_org_write" ON public.equipes;
CREATE POLICY "equipes_org_write" ON public.equipes
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Fornecedores: READ scoped por org
DROP POLICY IF EXISTS "fornecedores_org_read" ON public.fornecedores;
CREATE POLICY "fornecedores_org_read" ON public.fornecedores
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Fornecedores: WRITE scoped por org
DROP POLICY IF EXISTS "fornecedores_org_write" ON public.fornecedores;
CREATE POLICY "fornecedores_org_write" ON public.fornecedores
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Documentos: READ scoped por org
DROP POLICY IF EXISTS "documentos_org_read" ON public.documentos;
CREATE POLICY "documentos_org_read" ON public.documentos
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Documentos: WRITE scoped por org
DROP POLICY IF EXISTS "documentos_org_write" ON public.documentos;
CREATE POLICY "documentos_org_write" ON public.documentos
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Checklists: READ scoped por org
DROP POLICY IF EXISTS "checklists_org_read" ON public.checklists;
CREATE POLICY "checklists_org_read" ON public.checklists
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );

-- Checklists: WRITE scoped por org
DROP POLICY IF EXISTS "checklists_org_write" ON public.checklists;
CREATE POLICY "checklists_org_write" ON public.checklists
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR org_id IS NULL
  );
;
