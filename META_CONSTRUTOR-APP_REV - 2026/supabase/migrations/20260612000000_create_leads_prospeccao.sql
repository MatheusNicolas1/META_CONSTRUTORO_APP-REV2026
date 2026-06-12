-- ============================================================================
-- Migration: Create leads_prospeccao table
-- Descrição: Leads prospectados (base de contatos para prospecção) — CSV import
-- Data: 2026-06-12
-- ============================================================================

-- 1. leads_prospeccao — Base de contatos coletados via scraping
CREATE TABLE IF NOT EXISTS public.leads_prospeccao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT DEFAULT '',
    site TEXT DEFAULT '',
    email TEXT NOT NULL,
    telefone TEXT DEFAULT '',
    estado TEXT DEFAULT '',
    cidade TEXT DEFAULT '',
    origem TEXT DEFAULT 'base_original',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_leads_prospeccao_email ON public.leads_prospeccao(email);

COMMENT ON TABLE public.leads_prospeccao IS 'Leads prospectados (base de contatos de construtoras)';

-- 2. RLS
ALTER TABLE public.leads_prospeccao ENABLE ROW LEVEL SECURITY;

-- SELECT: anônimos podem consultar por email (necessário para o lookup na tela de login)
CREATE POLICY "leads_prospeccao_select_anon_email"
    ON public.leads_prospeccao FOR SELECT
    TO anon
    USING (true);

-- INSERT: apenas autenticados
CREATE POLICY "leads_prospeccao_insert_authenticated"
    ON public.leads_prospeccao FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- UPDATE: apenas autenticados
CREATE POLICY "leads_prospeccao_update_authenticated"
    ON public.leads_prospeccao FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: apenas autenticados
CREATE POLICY "leads_prospeccao_delete_authenticated"
    ON public.leads_prospeccao FOR DELETE
    TO authenticated
    USING (true);
