-- ============================================================================
-- MILESTONE 15: UNIFIED ORG_ID MIGRATION & DOCUMENTS TABLE (CORRECTED ENUMS)
-- ============================================================================
-- 1. Standardization: Add org_id to implementation tables (Equipes, Equipamentos, Fornecedores, Notifications)
-- 2. New Feature: Create Documents table and infrastructure
-- 3. FIX: Uses correct app_role enum values ('Administrador', 'Gerente') instead of ('owner', 'admin')
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EQUIPES (Collaborators)
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipes' AND column_name = 'org_id') THEN
    ALTER TABLE public.equipes ADD COLUMN org_id uuid REFERENCES public.orgs(id);
    CREATE INDEX idx_equipes_org_id ON public.equipes(org_id);
    
    -- Backfill: Match via user_id -> org.owner_user_id (Simulated association for personal workspace)
    UPDATE public.equipes e
    SET org_id = orgs.id
    FROM public.orgs
    WHERE e.user_id = orgs.owner_user_id
    AND e.org_id IS NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. EQUIPAMENTOS
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipamentos' AND column_name = 'org_id') THEN
    ALTER TABLE public.equipamentos ADD COLUMN org_id uuid REFERENCES public.orgs(id);
    CREATE INDEX idx_equipamentos_org_id ON public.equipamentos(org_id);
    
    -- Backfill
    UPDATE public.equipamentos e
    SET org_id = orgs.id
    FROM public.orgs
    WHERE e.user_id = orgs.owner_user_id
    AND e.org_id IS NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. FORNECEDORES
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'org_id') THEN
    ALTER TABLE public.fornecedores ADD COLUMN org_id uuid REFERENCES public.orgs(id);
    CREATE INDEX idx_fornecedores_org_id ON public.fornecedores(org_id);
    
    -- Backfill
    UPDATE public.fornecedores f
    SET org_id = orgs.id
    FROM public.orgs
    WHERE f.user_id = orgs.owner_user_id
    AND f.org_id IS NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. NOTIFICATIONS
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'org_id') THEN
    ALTER TABLE public.notifications ADD COLUMN org_id uuid REFERENCES public.orgs(id);
    CREATE INDEX idx_notifications_org_id ON public.notifications(org_id);
    
    -- Backfill (Best Effort)
    UPDATE public.notifications n
    SET org_id = orgs.id
    FROM public.orgs
    WHERE n.user_id = orgs.owner_user_id
    AND n.org_id IS NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. DOCUMENTS INFRASTRUCTURE
-- ----------------------------------------------------------------------------

-- ENUM for Document Types
DO $$ BEGIN
    CREATE TYPE public.document_type AS ENUM (
        'projeto', 'licenca', 'relatorio', 'memorial', 'cronograma', 
        'contrato', 'certificado', 'laudo', 'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES public.orgs(id),
    obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
    
    title text NOT NULL,
    description text,
    category public.document_type NOT NULL DEFAULT 'outros',
    
    file_url text NOT NULL,
    file_path text NOT NULL, -- Storage path
    file_type text, -- MIME type
    file_size bigint, -- Bytes
    
    uploaded_by uuid REFERENCES auth.users(id),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_obra_id ON public.documents(obra_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies for Documents
-- View: Members of the Org
DROP POLICY IF EXISTS "Members can view org documents" ON public.documents;
CREATE POLICY "Members can view org documents" ON public.documents
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.org_members WHERE org_id = documents.org_id
        )
    );

-- Insert: Members with permission
DROP POLICY IF EXISTS "Members can upload documents" ON public.documents;
CREATE POLICY "Members can upload documents" ON public.documents
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.org_members WHERE org_id = documents.org_id
        )
    );

-- Update/Delete: Owners and Admins (CORRECTED ENUM VALUES)
-- Note: Cast role to text if needed, but here we use valid ENUM values 'Administrador' and 'Gerente'.
-- Since 'owner' is strictly referencing the organization owner in 'orgs' table, we check that too.
DROP POLICY IF EXISTS "Uploader or Admin can edit documents" ON public.documents;
CREATE POLICY "Uploader or Admin can edit documents" ON public.documents
    FOR UPDATE
    USING (
        auth.uid() = uploaded_by OR
        -- Check if user is Org Owner
        auth.uid() IN (
             SELECT owner_user_id FROM public.orgs WHERE id = documents.org_id
        ) OR
        -- Check if user is Admin in Org Members
        auth.uid() IN (
            SELECT user_id FROM public.org_members 
            WHERE org_id = documents.org_id AND role IN ('Administrador'::app_role)
        )
    );
    
DROP POLICY IF EXISTS "Uploader or Admin can delete documents" ON public.documents;
CREATE POLICY "Uploader or Admin can delete documents" ON public.documents
    FOR DELETE
    USING (
        auth.uid() = uploaded_by OR
        -- Check if user is Org Owner
        auth.uid() IN (
             SELECT owner_user_id FROM public.orgs WHERE id = documents.org_id
        ) OR
        -- Check if user is Admin in Org Members
        auth.uid() IN (
            SELECT user_id FROM public.org_members 
            WHERE org_id = documents.org_id AND role IN ('Administrador'::app_role)
        )
    );

-- ----------------------------------------------------------------------------
-- 6. UPDATE RLS for Secondary Tables (to use org_id)
-- ----------------------------------------------------------------------------

-- Equipes
DROP POLICY IF EXISTS "Users can view their own equipes" ON public.equipes;
DROP POLICY IF EXISTS "Org members can view equipes" ON public.equipes;
CREATE POLICY "Org members can view equipes" ON public.equipes
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org admins can manage equipes" ON public.equipes;
CREATE POLICY "Org admins can manage equipes" ON public.equipes
    FOR ALL
    USING (
        -- Org Owner
        auth.uid() IN (
             SELECT owner_user_id FROM public.orgs WHERE id = equipes.org_id
        ) OR
        -- Org Admin
        org_id IN (
            SELECT org_id FROM public.org_members 
            WHERE user_id = auth.uid() AND role IN ('Administrador'::app_role)
        )
    );

-- Equipamentos
DROP POLICY IF EXISTS "Users can view their own equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Org members can view equipamentos" ON public.equipamentos;
CREATE POLICY "Org members can view equipamentos" ON public.equipamentos
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can manage equipamentos" ON public.equipamentos;
CREATE POLICY "Org members can manage equipamentos" ON public.equipamentos
    FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- Fornecedores
DROP POLICY IF EXISTS "Users can view their own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Org members can view fornecedores" ON public.fornecedores;
CREATE POLICY "Org members can view fornecedores" ON public.fornecedores
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Org members can manage fornecedores" ON public.fornecedores;
CREATE POLICY "Org members can manage fornecedores" ON public.fornecedores
    FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

COMMIT;
