-- ============================================================================
-- Migration: Create leads table for capture page
-- Descrição: Armazena leads capturados na página de captura (RDO grátis)
-- Data: 2026-06-10
-- ============================================================================

-- ============================================================================
-- 1. leads — Leads da página de captura
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    role TEXT NOT NULL,
    company_size TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    download_count INTEGER NOT NULL DEFAULT 1
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

COMMENT ON TABLE public.leads IS 'Leads capturados na página de captura (RDO grátis / landing page)';
COMMENT ON COLUMN public.leads.name IS 'Nome completo do lead';
COMMENT ON COLUMN public.leads.email IS 'E-mail de trabalho do lead';
COMMENT ON COLUMN public.leads.whatsapp IS 'WhatsApp com máscara (XX) XXXXX-XXXX';
COMMENT ON COLUMN public.leads.role IS 'Cargo: Proprietário/Sócio, Engenheiro, etc';
COMMENT ON COLUMN public.leads.company_size IS 'Porte da empresa: Autônomo, 1-3 obras, 4-10, 10+';
COMMENT ON COLUMN public.leads.download_count IS 'Quantidade de vezes que baixou o RDO';

-- ============================================================================
-- 2. RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- INSERT: qualquer pessoa (anônimo ou autenticado) pode cadastrar lead
-- (formulário público da página de captura)
CREATE POLICY "leads_insert_public"
    ON public.leads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- SELECT: apenas usuários autenticados podem visualizar leads
CREATE POLICY "leads_select_authenticated"
    ON public.leads FOR SELECT
    TO authenticated
    USING (true);

-- UPDATE: apenas usuários autenticados podem atualizar
CREATE POLICY "leads_update_authenticated"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: apenas usuários autenticados podem excluir
CREATE POLICY "leads_delete_authenticated"
    ON public.leads FOR DELETE
    TO authenticated
    USING (true);
