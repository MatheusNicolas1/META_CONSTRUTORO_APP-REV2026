-- Migration: create_rdo_notas
-- Objetivo: Criar tabela para armazenar notas vinculadas aos RDOs

CREATE TABLE IF NOT EXISTS rdo_notas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rdo_id UUID NOT NULL REFERENCES rdos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    org_id UUID NOT NULL REFERENCES orgs(id),
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS rdo_notas_rdo_id_idx ON rdo_notas(rdo_id);
CREATE INDEX IF NOT EXISTS rdo_notas_org_id_idx ON rdo_notas(org_id);

-- RLS setup
ALTER TABLE rdo_notas ENABLE ROW LEVEL SECURITY;

-- Políticas multi-tenant (vínculo via org_id) para isolamento por organização
CREATE POLICY "Visualização de notas restrita à organização"
    ON rdo_notas
    FOR SELECT
    USING (org_id IN (
        SELECT dom.org_id FROM org_members dom WHERE dom.user_id = auth.uid()
    ));

CREATE POLICY "Criação de notas restrita a membros da organização"
    ON rdo_notas
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT dom.org_id FROM org_members dom WHERE dom.user_id = auth.uid()
    ));

CREATE POLICY "Edição de notas restrita ao próprio autor"
    ON rdo_notas
    FOR UPDATE
    USING (user_id = auth.uid() AND org_id IN (
        SELECT dom.org_id FROM org_members dom WHERE dom.user_id = auth.uid()
    ));

CREATE POLICY "Exclusão de notas restrita ao próprio autor"
    ON rdo_notas
    FOR DELETE
    USING (user_id = auth.uid() AND org_id IN (
        SELECT dom.org_id FROM org_members dom WHERE dom.user_id = auth.uid()
    ));

-- Setup atualizacao de updated_at trigger (caso genérico exista)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'moddatetime') THEN
        CREATE TRIGGER handle_updated_at BEFORE UPDATE ON rdo_notas
        FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
    END IF;
END
$$;
;
