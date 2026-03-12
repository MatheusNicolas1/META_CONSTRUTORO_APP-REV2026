-- ============================================================================
-- SISTEMA DE CRÉDITOS E LIMITES POR PLANO
-- ============================================================================
-- 1. Adiciona coluna monthly_rdos à tabela plans
-- 2. Atualiza max_users/max_obras/monthly_rdos de todos os planos
-- 3. Cria tabela org_credits (saldo atual por org)
-- 4. Cria tabela credit_transactions (histórico)
-- 5. RLS em ambas as tabelas
-- 6. Inicializa créditos para orgs existentes no plano free
-- ============================================================================

-- ============================================
-- PARTE 1: Adicionar coluna monthly_rdos
-- ============================================
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS monthly_rdos INTEGER;

COMMENT ON COLUMN public.plans.monthly_rdos IS 
  'Créditos de RDO por mês. NULL = ilimitado (planos pagos).';

-- ============================================
-- PARTE 2: Atualizar limites de todos os planos
-- ============================================
UPDATE public.plans SET 
  max_users = 1, 
  max_obras = 1, 
  monthly_rdos = 7
WHERE slug = 'free';

UPDATE public.plans SET 
  max_users = 3, 
  max_obras = NULL,  -- ilimitado
  monthly_rdos = NULL -- ilimitado
WHERE slug = 'basic';

UPDATE public.plans SET 
  max_users = 5, 
  max_obras = NULL,
  monthly_rdos = NULL
WHERE slug = 'professional';

UPDATE public.plans SET 
  max_users = 15,     -- corrigido de 10 para 15
  max_obras = NULL,
  monthly_rdos = NULL
WHERE slug = 'master';

UPDATE public.plans SET 
  max_users = NULL,   -- ilimitado
  max_obras = NULL,
  monthly_rdos = NULL
WHERE slug = 'business';

UPDATE public.plans SET 
  max_users = NULL,
  max_obras = NULL,
  monthly_rdos = NULL
WHERE slug = 'premium';

-- ============================================
-- PARTE 3: Tabela org_credits
-- ============================================
CREATE TABLE IF NOT EXISTS public.org_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  rdo_credits_balance INTEGER NOT NULL DEFAULT 7,
  plan_type TEXT NOT NULL DEFAULT 'free',
  last_reset DATE NOT NULL DEFAULT CURRENT_DATE,

  CONSTRAINT org_credits_unique_org UNIQUE (org_id),
  CONSTRAINT org_credits_balance_non_negative CHECK (rdo_credits_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_org_credits_org_id ON public.org_credits(org_id);
CREATE INDEX IF NOT EXISTS idx_org_credits_plan ON public.org_credits(plan_type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_org_credits_updated_at ON public.org_credits;
CREATE TRIGGER update_org_credits_updated_at
  BEFORE UPDATE ON public.org_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PARTE 4: Tabela credit_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,

  CONSTRAINT credit_tx_type_valid CHECK (
    transaction_type IN ('consumption', 'renewal', 'bonus', 'adjustment', 'initial')
  )
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_org_id ON public.credit_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON public.credit_transactions(created_at DESC);

-- ============================================
-- PARTE 5: RLS
-- ============================================

-- org_credits
ALTER TABLE public.org_credits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'org_credits' AND policyname = 'Members can read org credits'
  ) THEN
    CREATE POLICY "Members can read org credits"
      ON public.org_credits FOR SELECT
      USING (
        org_id IN (
          SELECT om.org_id FROM public.org_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
      );
  END IF;
END $$;

-- credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_transactions' AND policyname = 'Members can read credit transactions'
  ) THEN
    CREATE POLICY "Members can read credit transactions"
      ON public.credit_transactions FOR SELECT
      USING (
        org_id IN (
          SELECT om.org_id FROM public.org_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
      );
  END IF;
END $$;

-- Service role pode escrever em ambas (triggers rodam como SECURITY DEFINER)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'org_credits' AND policyname = 'Service role manages credits'
  ) THEN
    CREATE POLICY "Service role manages credits"
      ON public.org_credits FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_transactions' AND policyname = 'Service role manages transactions'
  ) THEN
    CREATE POLICY "Service role manages transactions"
      ON public.credit_transactions FOR ALL
      TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- PARTE 6: Seed — inicializar créditos para orgs no plano free
-- ============================================
INSERT INTO public.org_credits (org_id, rdo_credits_balance, plan_type, last_reset)
SELECT 
  o.id,
  7,
  'free',
  CURRENT_DATE
FROM public.orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM public.org_credits oc WHERE oc.org_id = o.id
)
ON CONFLICT (org_id) DO NOTHING;

-- Registrar transação inicial
INSERT INTO public.credit_transactions (org_id, transaction_type, amount, balance_before, balance_after, description)
SELECT 
  oc.org_id,
  'initial',
  7,
  0,
  7,
  'Créditos iniciais do plano gratuito'
FROM public.org_credits oc
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct 
  WHERE ct.org_id = oc.org_id AND ct.transaction_type = 'initial'
);
