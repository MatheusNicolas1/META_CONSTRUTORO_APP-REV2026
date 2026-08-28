-- Migration: rdo_nichos + rdo_agendas + alter rdos
-- Descrição: Cria o sistema de agrupamento de RDOs por dia e nicho
-- Data: 2026-06-10
-- Baseado em: PRD_AGENDAS_RDO.md + PRD_NICHOS_RDO.md

-- ============================================================
-- PARTE 1: Tabela de Nichos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rdo_nichos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    descricao TEXT,
    cor TEXT NOT NULL DEFAULT '#6366f1',
    icone TEXT DEFAULT 'Folder',
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- ============================================================
-- PARTE 2: Tabela de Agendas Diárias (Diário de Bordo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rdo_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    titulo TEXT,
    resumo_geral TEXT,
    clima_geral TEXT,
    observacoes_gestor TEXT,
    criado_por_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, data)
);

-- ============================================================
-- PARTE 3: Adicionar colunas na tabela rdos
-- ============================================================
ALTER TABLE public.rdos
ADD COLUMN IF NOT EXISTS nicho_id UUID REFERENCES public.rdo_nichos(id);

ALTER TABLE public.rdos
ADD COLUMN IF NOT EXISTS agenda_id UUID REFERENCES public.rdo_agendas(id);

-- ============================================================
-- PARTE 4: Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rdos_data_nicho
ON public.rdos(data, nicho_id)
WHERE status IN ('SUBMITTED', 'APPROVED');

CREATE INDEX IF NOT EXISTS idx_rdos_data_org
ON public.rdos(org_id, data)
WHERE status IN ('SUBMITTED', 'APPROVED');

CREATE INDEX IF NOT EXISTS idx_rdo_agendas_data_org
ON public.rdo_agendas(org_id, data);

CREATE INDEX IF NOT EXISTS idx_rdo_nichos_org_ordem
ON public.rdo_nichos(org_id, ordem);

-- ============================================================
-- PARTE 5: RLS Policies
-- ============================================================
ALTER TABLE public.rdo_nichos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdo_agendas ENABLE ROW LEVEL SECURITY;

-- rdo_nichos: todos da org podem ver, só admin pode gerenciar
CREATE POLICY "rdo_nichos_select_org"
ON public.rdo_nichos FOR SELECT
TO authenticated
USING (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid);

CREATE POLICY "rdo_nichos_insert_admin"
ON public.rdo_nichos FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid
    AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('presidente', 'administrador')
);

CREATE POLICY "rdo_nichos_update_admin"
ON public.rdo_nichos FOR UPDATE
TO authenticated
USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid
    AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('presidente', 'administrador')
);

CREATE POLICY "rdo_nichos_delete_admin"
ON public.rdo_nichos FOR DELETE
TO authenticated
USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid
    AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('presidente', 'administrador')
);

-- rdo_agendas: todos da org podem ver e criar (auto)
CREATE POLICY "rdo_agendas_select_org"
ON public.rdo_agendas FOR SELECT
TO authenticated
USING (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid);

CREATE POLICY "rdo_agendas_insert_org"
ON public.rdo_agendas FOR INSERT
TO authenticated
WITH CHECK (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid);

CREATE POLICY "rdo_agendas_update_org"
ON public.rdo_agendas FOR UPDATE
TO authenticated
USING (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid);

-- ============================================================
-- PARTE 6: Trigger - Associação automática de agenda
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_assign_agenda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agenda_id UUID;
BEGIN
    -- Busca ou cria a agenda do dia para a org do RDO
    INSERT INTO public.rdo_agendas (org_id, data, criado_por_id)
    VALUES (NEW.org_id, NEW.data, NEW.criado_por_id)
    ON CONFLICT (org_id, data) DO NOTHING;

    SELECT id INTO v_agenda_id
    FROM public.rdo_agendas
    WHERE org_id = NEW.org_id AND data = NEW.data;

    NEW.agenda_id := v_agenda_id;
    RETURN NEW;
END;
$$;

-- Anexar o trigger ao INSERT em rdos
DROP TRIGGER IF EXISTS trg_auto_assign_agenda ON public.rdos;
CREATE TRIGGER trg_auto_assign_agenda
    BEFORE INSERT ON public.rdos
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_agenda();

-- ============================================================
-- PARTE 7: Seed de nichos default para uma organização
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_nichos(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rdo_nichos (org_id, nome, slug, descricao, cor, icone, ordem) VALUES
        (p_org_id, 'Execução de Obra', 'execucao-obra', 'Atividades físicas da obra: concretagem, alvenaria, estrutura, acabamento, instalações', '#3b82f6', 'HardHat', 1),
        (p_org_id, 'Segurança do Trabalho', 'seguranca-trabalho', 'DDS, inspeções de EPI, ocorrências de segurança, treinamentos', '#ef4444', 'Shield', 2),
        (p_org_id, 'Ordens e Serviços', 'ordens-servicos', 'OS programadas, serviços terceirizados, instalações específicas', '#f97316', 'ClipboardList', 3),
        (p_org_id, 'Equipes e Mão de Obra', 'equipes-mao-obra', 'Produtividade das equipes, colaboradores, escalas, horas trabalhadas', '#8b5cf6', 'Users', 4),
        (p_org_id, 'Equipamentos e Máquinas', 'equipamentos-maquinas', 'Operação de equipamentos, manutenções, quebras, horas máquina', '#f59e0b', 'Wrench', 5),
        (p_org_id, 'Materiais e Estoque', 'materiais-estoque', 'Recebimento, falta de materiais, estoque mínimo, almoxarifado', '#10b981', 'Package', 6),
        (p_org_id, 'Financeiro e Contratos', 'financeiro-contratos', 'Medições, boletins, notas fiscais, contratos, aditivos, fluxo de caixa', '#06b6d4', 'DollarSign', 7),
        (p_org_id, 'Documentos e Cliente', 'documentos-cliente', 'Documentos da obra, portal do cliente, aprovações, comunicação', '#ec4899', 'FileText', 8)
    ON CONFLICT (org_id, slug) DO NOTHING;
END;
$$;

-- Trigger para seed automático ao criar organização
CREATE OR REPLACE FUNCTION public.auto_seed_nichos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.seed_default_nichos(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_seed_nichos ON public.orgs;
CREATE TRIGGER trg_auto_seed_nichos
    AFTER INSERT ON public.orgs
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_seed_nichos();

-- Seed nichos para organizações existentes (executar uma vez)
-- SELECT public.seed_default_nichos(id) FROM public.orgs;
