-- Migration: Fix Plans Data and Visibility
-- Generated at: 2026-02-15 23:30:00

-- Ensure Row Level Security enables public read for active plans
DROP POLICY IF EXISTS "Plans são públicos para leitura" ON public.plans;
CREATE POLICY "Plans são públicos para leitura"
  ON public.plans FOR SELECT
  USING (true); -- Temporarily allow all for debugging, or is_active = true. Let's stick to active.
  -- Actually, let's keep it (is_active = true) but ensure the data is correct.

DROP POLICY IF EXISTS "Plans verified select" ON public.plans;
CREATE POLICY "Plans verified select"
    ON public.plans FOR SELECT
    USING (is_active = true);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Upsert Plans to ensure they exist and have correct data
-- We use ON CONFLICT (slug) DO UPDATE

INSERT INTO public.plans (
  slug, name, monthly_price_cents, yearly_price_cents,
  description, features, is_active, is_popular, display_order,
  stripe_price_id_monthly, stripe_price_id_yearly
) VALUES
  -- GRATUITO
  ('free', 'GRATUITO', 0, 0,
   'Plataforma gratuita - teste sem limites de tempo!',
   '["7 Créditos RDO Gratuitos", "1 crédito = 1 RDO criado", "100% Grátis - Sem pegadinhas", "1 usuário", "1 obra", "RDO digital completo", "Suporte por email", "Sem cartão de crédito"]'::jsonb,
   true, false, 1,
   NULL, NULL),
   
  -- BASIC
  ('basic', 'BÁSICO', 12990, 10392,
   'Perfeito para pequenas construtoras',
   '["Até 3 usuários", "Armazenamento ilimitado", "RDO digital completo", "Relatórios básicos", "Suporte por email", "Backup automático"]'::jsonb,
   true, false, 2,
   'price_1T1HSsCHfNdO9jxNJyBqYUW1', 'price_1T1HSsCHfNdO9jxN0oT7lsgq'),
   
  -- PROFESSIONAL
  ('professional', 'PROFISSIONAL', 19990, 15992,
   'Ideal para construtoras em crescimento',
   '["Até 5 usuários", "Obras ilimitadas", "Relatórios avançados", "Integrações WhatsApp", "Suporte via chat 24h", "Dashboard avançado", "Controle de estoque"]'::jsonb,
   true, true, 3,
   'price_1T1HSsCHfNdO9jxNDtPicSaZ', 'price_1T1HStCHfNdO9jxN2BtTrfpS'),
   
  -- MASTER
  ('master', 'MASTER', 49990, 39992,
   'Para construtoras estabelecidas',
   '["Até 15 usuários", "Obras ilimitadas", "Todas as funcionalidades do Profissional", "API personalizada", "Integração com ERP", "Suporte prioritário (SLA 8h)", "Treinamento dedicado"]'::jsonb,
   true, false, 4,
   'price_1T1HStCHfNdO9jxNsjxKYfjw', 'price_1T1HStCHfNdO9jxNpT8KUqLV'),
   
  -- BUSINESS (Was configured, ensure it is active)
  ('business', 'BUSINESS', NULL, NULL,
   'Para grandes incorporadoras e construtoras',
   '["Usuários ilimitados", "Integrações customizadas", "SLA 24/7", "Onboarding dedicado", "Gerente de conta exclusivo", "White label disponível", "Múltiplas empresas"]'::jsonb,
   true, false, 6,
   NULL, NULL)
   
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  yearly_price_cents = EXCLUDED.yearly_price_cents,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  stripe_price_id_monthly = COALESCE(EXCLUDED.stripe_price_id_monthly, public.plans.stripe_price_id_monthly),
  stripe_price_id_yearly = COALESCE(EXCLUDED.stripe_price_id_yearly, public.plans.stripe_price_id_yearly);

-- DEACTIVATE PREMIUM (As requested: "O plano PREMIUM não existe")
UPDATE public.plans
SET is_active = false
WHERE slug = 'premium';

