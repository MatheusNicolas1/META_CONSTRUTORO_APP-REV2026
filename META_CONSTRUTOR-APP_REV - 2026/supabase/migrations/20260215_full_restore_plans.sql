-- Full Restore: Plans Table and Data
-- Run this in Supabase SQL Editor if your plans are missing

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price_cents INTEGER,
  yearly_price_cents INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER,
  max_obras INTEGER,
  trial_days INTEGER DEFAULT 0,
  CONSTRAINT plans_slug_format CHECK (slug ~ '^[a-z0-9_-]+$')
);

-- 2. Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy (Allow Public Read)
DROP POLICY IF EXISTS "Plans são públicos para leitura" ON public.plans;
CREATE POLICY "Plans são públicos para leitura"
  ON public.plans FOR SELECT
  USING (true);

-- 4. Upsert Data (Fix Missing Plans & Hide Premium)
INSERT INTO public.plans (
  slug, name, monthly_price_cents, yearly_price_cents,
  description, features, is_active, is_popular, display_order,
  stripe_price_id_monthly, stripe_price_id_yearly
) VALUES
  ('free', 'GRATUITO', 0, 0,
   'Plataforma gratuita - teste sem limites de tempo!',
   '["7 Créditos RDO Gratuitos", "1 crédito = 1 RDO criado", "100% Grátis - Sem pegadinhas", "1 usuário", "1 obra", "RDO digital completo", "Suporte por email", "Sem cartão de crédito"]'::jsonb,
   true, false, 1,
   NULL, NULL),
   
  ('basic', 'BÁSICO', 12990, 10392,
   'Perfeito para pequenas construtoras',
   '["Até 3 usuários", "Armazenamento ilimitado", "RDO digital completo", "Relatórios básicos", "Suporte por email", "Backup automático"]'::jsonb,
   true, false, 2,
   'price_1T1HSsCHfNdO9jxNJyBqYUW1', 'price_1T1HSsCHfNdO9jxN0oT7lsgq'),
   
  ('professional', 'PROFISSIONAL', 19990, 15992,
   'Ideal para construtoras em crescimento',
   '["Até 5 usuários", "Obras ilimitadas", "Relatórios avançados", "Integrações WhatsApp", "Suporte via chat 24h", "Dashboard avançado", "Controle de estoque"]'::jsonb,
   true, true, 3,
   'price_1T1HSsCHfNdO9jxNDtPicSaZ', 'price_1T1HStCHfNdO9jxN2BtTrfpS'),
   
  ('master', 'MASTER', 49990, 39992,
   'Para construtoras estabelecidas',
   '["Até 15 usuários", "Obras ilimitadas", "Todas as funcionalidades do Profissional", "API personalizada", "Integração com ERP", "Suporte prioritário (SLA 8h)", "Treinamento dedicado"]'::jsonb,
   true, false, 4,
   'price_1T1HStCHfNdO9jxNsjxKYfjw', 'price_1T1HStCHfNdO9jxNpT8KUqLV'),
   
  ('business', 'BUSINESS', NULL, NULL,
   'Para grandes incorporadoras e construtoras',
   '["Usuários ilimitados", "Integrações customizadas", "SLA 24/7", "Onboarding dedicado", "Gerente de conta exclusivo", "White label disponível", "Múltiplas empresas"]'::jsonb,
   true, false, 6,
   NULL, NULL),
   
  ('premium', 'PREMIUM', 74990, 719904,
   'Plano Premium Descontinuado',
   '[]'::jsonb,
   false, false, 99, 
   'price_1T1HSuCHfNdO9jxNZXGzFFC2', 'price_1T1HSuCHfNdO9jxNYdWIg3ia')
   
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
