-- Migration: rdo_nichos complementar
-- Descrição: Adiciona coluna is_default, atualiza RLS e reforça idempotência
-- Data: 2026-06-10
-- Baseado em: PRD_NICHOS_RDO.md (seção 4) — diferenças entre o PRD e a migration original

-- ============================================================
-- PARTE 1: Adicionar coluna is_default (se não existir)
-- ============================================================
ALTER TABLE public.rdo_nichos
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- PARTE 2: Atualizar função seed_default_nichos para incluir is_default
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_nichos(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rdo_nichos (org_id, nome, slug, descricao, cor, icone, is_default, ordem) VALUES
        (p_org_id, 'Execução de Obra',        'execucao-obra',        'Atividades físicas da obra: concretagem, alvenaria, estrutura, acabamento, instalações',  '#3b82f6', 'HardHat',        true, 1),
        (p_org_id, 'Segurança do Trabalho',    'seguranca-trabalho',   'DDS, inspeções de EPI, ocorrências de segurança, treinamentos',                           '#ef4444', 'Shield',         true, 2),
        (p_org_id, 'Ordens e Serviços',        'ordens-servicos',      'OS programadas, serviços terceirizados, instalações específicas',                         '#f97316', 'ClipboardList',  true, 3),
        (p_org_id, 'Equipes e Mão de Obra',    'equipes-mao-obra',     'Produtividade das equipes, colaboradores, escalas, horas trabalhadas',                     '#8b5cf6', 'Users',          true, 4),
        (p_org_id, 'Equipamentos e Máquinas',  'equipamentos-maquinas','Operação de equipamentos, manutenções, quebras, horas máquina',                           '#f59e0b', 'Wrench',         true, 5),
        (p_org_id, 'Materiais e Estoque',      'materiais-estoque',    'Recebimento, falta de materiais, estoque mínimo, almoxarifado',                           '#10b981', 'Package',        true, 6),
        (p_org_id, 'Financeiro e Contratos',   'financeiro-contratos', 'Medições, boletins, notas fiscais, contratos, aditivos, fluxo de caixa',                  '#06b6d4', 'DollarSign',     true, 7),
        (p_org_id, 'Documentos e Cliente',     'documentos-cliente',   'Documentos da obra, portal do cliente, aprovações, comunicação',                         '#ec4899', 'FileText',       true, 8)
    ON CONFLICT (org_id, slug) DO UPDATE
        SET is_default = EXCLUDED.is_default,
            descricao  = EXCLUDED.descricao,
            cor        = EXCLUDED.cor,
            icone      = EXCLUDED.icone,
            ordem      = EXCLUDED.ordem;
END;
$$;

-- ============================================================
-- PARTE 3: Recriar trigger auto_seed_nichos (já existente, recriamos para garantir)
-- ============================================================
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

-- ============================================================
-- PARTE 4: Atualizar RLS — DELETE só permite excluir nichos não-default
-- ============================================================
-- Atualizar policy de DELETE para proteger nichos default
DROP POLICY IF EXISTS "rdo_nichos_delete_admin" ON public.rdo_nichos;

CREATE POLICY "rdo_nichos_delete_admin"
ON public.rdo_nichos FOR DELETE
TO authenticated
USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')::uuid
    AND auth.jwt() -> 'user_metadata' ->> 'role' IN ('presidente', 'administrador')
    AND is_default = false  -- nichos default não podem ser excluídos
);

-- ============================================================
-- PARTE 5: Seed nichos para organizações existentes (se já não foram criados)
-- Executar manualmente se necessário:
-- SELECT public.seed_default_nichos(id) FROM public.orgs;
-- ============================================================

-- ============================================================
-- PARTE 6: Índice complementar para busca por org + nicho
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rdos_org_nicho
ON public.rdos(org_id, nicho_id)
WHERE nicho_id IS NOT NULL;
