-- Migration: email_click_tracking
-- Cria tabela de tracking de cliques para campanhas de email
-- Cada clique de um contato em um link de campanha é registrado aqui

CREATE TABLE IF NOT EXISTS public.email_click_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id text NOT NULL,          -- id do contato na base (contatos_master.csv)
  campaign_day text NOT NULL,        -- ex: 'dia-01', 'dia-02' etc
  link_destino text NOT NULL,        -- URL de destino original (após redirect)
  utm_source text DEFAULT 'email',
  utm_medium text DEFAULT 'campanha26',
  utm_campaign text,                 -- ex: 'dia-01'
  utm_content text,                  -- ex: 'rdo-tecnico', 'cta-principal', etc
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  -- ref para tracking de dispositivos
  device_type text,                  -- 'mobile', 'desktop', 'tablet'
  browser text,
  os text
);

-- Índices para consultas rápidas
CREATE INDEX idx_email_click_contact_id ON public.email_click_log(contact_id);
CREATE INDEX idx_email_click_campaign_day ON public.email_click_log(campaign_day);
CREATE INDEX idx_email_click_clicked_at ON public.email_click_log(clicked_at DESC);
CREATE INDEX idx_email_click_utm_campaign ON public.email_click_log(utm_campaign);

-- Permissões: anon pode INSERT (vindo do redirect público)
-- Apenas roles autenticadas podem SELECT/UPDATE/DELETE
ALTER TABLE public.email_click_log ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode inserir (o redirect tracking é público)
CREATE POLICY "Anyone can insert email clicks"
  ON public.email_click_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: apenas admins podem ver os dados
CREATE POLICY "Admins can view email clicks"
  ON public.email_click_log
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('Presidente', 'Administrador')
  );

-- Política: apenas admins podem deletar
CREATE POLICY "Admins can delete email clicks"
  ON public.email_click_log
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('Presidente', 'Administrador')
  );

-- Trigger para atualizar updated_at (se necessário no futuro)
-- Criamos uma função helper reutilizável
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Nota: email_click_log não precisa de updated_at (é imutável por design)
-- Cada registro é um evento atômico de clique

-- View agregada para dashboard: cliques por dia de campanha
CREATE OR REPLACE VIEW public.vw_email_clicks_by_day AS
SELECT
  campaign_day,
  count(*) AS total_cliques,
  count(DISTINCT contact_id) AS contatos_unicos,
  min(clicked_at) AS primeiro_clique,
  max(clicked_at) AS ultimo_clique
FROM public.email_click_log
GROUP BY campaign_day
ORDER BY campaign_day;

-- View agregada: contatos que mais clicaram
CREATE OR REPLACE VIEW public.vw_email_top_clickers AS
SELECT
  contact_id,
  count(*) AS total_cliques,
  count(DISTINCT campaign_day) AS dias_ativos,
  max(clicked_at) AS ultimo_clique
FROM public.email_click_log
GROUP BY contact_id
ORDER BY count(*) DESC;
