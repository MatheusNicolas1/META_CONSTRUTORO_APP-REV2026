
-- Adicionar colunas de aprovação formal ao checklists (já tem signature_*, mas falta aprovação formal)
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS aprovado_por_id UUID REFERENCES auth.users(id);
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ;
;
