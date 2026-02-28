-- ============================================================================
-- MILESTONE 4.1: Plans Source of Truth (sem hardcode)
-- ============================================================================
-- Criar tabela plans como fonte única de verdade para planos e preços
-- Frontend lerá daqui via edge function ou SELECT público
-- ============================================================================

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Identificação
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Preços (em centavos para evitar problemas de precisão)
  monthly_price_cents INTEGER,
  yearly_price_cents INTEGER,
  
  -- Stripe integration
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  
  -- Metadata
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Controles
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Limites (para enforcement futuro)
  max_users INTEGER,
  max_obras INTEGER,
  trial_days INTEGER DEFAULT 0,
  
  CONSTRAINT plans_slug_format CHECK (slug ~ '^[a-z0-9_-]+$'),
  CONSTRAINT plans_prices_positive CHECK ((monthly_price_cents IS NULL OR monthly_price_cents >= 0) AND (yearly_price_cents IS NULL OR yearly_price_cents >= 0))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plans_slug ON public.plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_order ON public.plans(display_order);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: leitura pública (qualquer um pode ver planos ativos)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plans' AND policyname = 'Plans são públicos para leitura') THEN
        CREATE POLICY "Plans são públicos para leitura"
          ON public.plans FOR SELECT
          USING (is_active = true);
    END IF;
END $$;

-- Seed: inserir planos existentes
SET role TO postgres;

INSERT INTO public.plans (
  slug, name, monthly_price_cents, yearly_price_cents,
  description, features, is_active, is_popular, display_order,
  max_users, max_obras, trial_days
) VALUES
  ('free', 'FREE', 0, 0,
   'Teste gratuito de 14 dias',
   '["Teste gratuito de 14 dias", "1 usuário", "1 obra", "RDO básico", "Suporte por email", "Sem cartão de crédito"]'::jsonb,
   true, false, 1, 1, 1, 14),
  
  ('basic', 'BÁSICO', 12990, 10392,
   'Perfeito para pequenas construtoras',
   '["Até 3 usuários", "Armazenamento ilimitado", "RDO digital completo", "Relatórios básicos", "Suporte por email", "Backup automático"]'::jsonb,
   true, false, 2, 3, NULL, 0),
  
  ('professional', 'PROFISSIONAL', 19990, 15992,
   'Ideal para construtoras em crescimento',
   '["Até 5 usuários", "Obras ilimitadas", "Relatórios avançados", "Integrações WhatsApp", "Suporte via chat 24h", "Dashboard avançado", "Controle de estoque"]'::jsonb,
   true, true, 3, 5, NULL, 0),
  
  ('master', 'MASTER', 49990, 39992,
   'Para construtoras que precisam de mais',
   '["Até 10 usuários", "Obras ilimitadas", "Todos recursos PRO", "Gestão de equipes", "Integração com Gmail", "Dashboard executivo", "API de integração", "Gestor de obras dedicado"]'::jsonb,
   true, false, 4, 10, NULL, 0),
  
  ('premium', 'PREMIUM', 74990, 59992,
   'Solução completa empresarial',
   '["Até 20 usuários", "Todas funcionalidades", "Suporte prioritário 24/7", "Treinamento dedicado", "SLA garantido", "Customizações incluídas", "Migração assistida"]'::jsonb,
   true, false, 5, 20, NULL, 0),
  
  ('business', 'BUSINESS', NULL, NULL,
   'Para o plano Business, entre em contato conosco para uma proposta personalizada.',
   '["Usuários ilimitados", "Infraestrutura dedicada", "Customização completa", "Integrações sob medida", "Suporte VIP", "Consultoria estratégica"]'::jsonb,
   true, false, 6, NULL, NULL, 0)
ON CONFLICT (slug) DO NOTHING;

RESET role;


