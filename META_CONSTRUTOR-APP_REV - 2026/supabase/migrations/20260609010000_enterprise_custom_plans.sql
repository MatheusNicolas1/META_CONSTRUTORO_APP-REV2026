-- ============================================================================
-- ENTERPRISE CUSTOM PLANS
-- Tabela para planos Enterprise customizados por cliente
-- Cada plano tem preço único negociado, funções customizadas e vigência
-- Gerenciável apenas pelo admin presidente
-- ============================================================================

-- 1. Tabela enterprise_custom_plans
CREATE TABLE IF NOT EXISTS public.enterprise_custom_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Identificação
  name TEXT NOT NULL,                     -- ex: "Enterprise - Construtora ABC"
  slug TEXT NOT NULL UNIQUE,              -- ex: "enterprise-construtora-abc"
  description TEXT DEFAULT '',
  
  -- Cliente vinculado
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  
  -- Preço customizado (centavos)
  monthly_price_cents INTEGER NOT NULL CHECK (monthly_price_cents >= 0),
  yearly_price_cents INTEGER,
  
  -- Stripe (opcional, preenchido após criar produto na Stripe)
  stripe_product_id TEXT,                  -- prod_xxx na Stripe
  stripe_price_id_monthly TEXT,            -- price_xxx mensal
  stripe_price_id_yearly TEXT,             -- price_xxx anual
  
  -- Funções customizadas (JSON)
  -- Ex: ["white_label", "sso", "on_premise", "api_ilimitada", "treinamento_dedicado"]
  custom_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Limites
  max_users INTEGER,
  max_obras INTEGER,
  
  -- Vigência
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,                 -- NULL = sem expiração
  trial_days INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'negotiating', 'expired', 'cancelled')),
  
  -- Notas internas do admin
  internal_notes TEXT DEFAULT '',
  
  -- Metadados flexíveis
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enterprise_custom_plans_org_id ON public.enterprise_custom_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_custom_plans_slug ON public.enterprise_custom_plans(slug);
CREATE INDEX IF NOT EXISTS idx_enterprise_custom_plans_status ON public.enterprise_custom_plans(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_custom_plans_created_at ON public.enterprise_custom_plans(created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_enterprise_custom_plans_updated_at ON public.enterprise_custom_plans;
CREATE TRIGGER update_enterprise_custom_plans_updated_at
  BEFORE UPDATE ON public.enterprise_custom_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. RLS
ALTER TABLE public.enterprise_custom_plans ENABLE ROW LEVEL SECURITY;

-- Leitura: presidente vê tudo (via role check na app)
-- Público: qualquer um pode ver planos ativos com status 'negotiating' (para consulta)
CREATE POLICY "Enterprise plans visiveis publicamente se ativos/negotiating"
  ON public.enterprise_custom_plans FOR SELECT
  USING (status IN ('active', 'negotiating'));

-- Insert/Update/Delete: apenas via Edge Function (service_role) ou triggers
-- O frontend admin usa Edge Function, não consulta direta

-- 3. Log de alterações (audit trail)
CREATE TABLE IF NOT EXISTS public.enterprise_plan_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plan_id UUID NOT NULL REFERENCES public.enterprise_custom_plans(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                    -- 'created', 'updated', 'activated', 'deactivated', 'price_changed', 'stripe_linked'
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_enterprise_plan_audit_plan_id ON public.enterprise_plan_audit_log(plan_id);
ALTER TABLE public.enterprise_plan_audit_log ENABLE ROW LEVEL SECURITY;

-- Presidente pode ver logs de auditoria
CREATE POLICY "Enterprise plan audit logs visiveis para autenticados"
  ON public.enterprise_plan_audit_log FOR SELECT
  TO authenticated
  USING (true);

-- 4. Função auxiliar: criar plano Enterprise com auditoria automática
CREATE OR REPLACE FUNCTION public.create_enterprise_plan(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT '',
  p_org_id UUID DEFAULT NULL,
  p_monthly_price_cents INTEGER DEFAULT 0,
  p_yearly_price_cents INTEGER DEFAULT NULL,
  p_custom_features JSONB DEFAULT '[]'::jsonb,
  p_max_users INTEGER DEFAULT NULL,
  p_max_obras INTEGER DEFAULT NULL,
  p_trial_days INTEGER DEFAULT 0,
  p_internal_notes TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  INSERT INTO public.enterprise_custom_plans (
    name, slug, description, org_id,
    monthly_price_cents, yearly_price_cents,
    custom_features, max_users, max_obras, trial_days,
    internal_notes, created_by
  ) VALUES (
    p_name, p_slug, p_description, p_org_id,
    p_monthly_price_cents, p_yearly_price_cents,
    p_custom_features, p_max_users, p_max_obras, p_trial_days,
    p_internal_notes, auth.uid()
  )
  RETURNING id INTO v_plan_id;

  INSERT INTO public.enterprise_plan_audit_log (plan_id, action, changed_by, new_values)
  VALUES (v_plan_id, 'created', auth.uid(),
    jsonb_build_object(
      'name', p_name,
      'slug', p_slug,
      'monthly_price_cents', p_monthly_price_cents,
      'yearly_price_cents', p_yearly_price_cents
    )
  );

  RETURN v_plan_id;
END;
$$;

-- 5. Função para atualizar plano Enterprise com auditoria
CREATE OR REPLACE FUNCTION public.update_enterprise_plan(
  p_plan_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_monthly_price_cents INTEGER DEFAULT NULL,
  p_yearly_price_cents INTEGER DEFAULT NULL,
  p_custom_features JSONB DEFAULT NULL,
  p_max_users INTEGER DEFAULT NULL,
  p_max_obras INTEGER DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_internal_notes TEXT DEFAULT NULL,
  p_stripe_product_id TEXT DEFAULT NULL,
  p_stripe_price_id_monthly TEXT DEFAULT NULL,
  p_stripe_price_id_yearly TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old RECORD;
  v_changes JSONB DEFAULT '{}'::jsonb;
  v_new_jsonb JSONB;
  v_old_jsonb JSONB;
BEGIN
  SELECT * INTO v_old FROM public.enterprise_custom_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Montar old_values
  v_old_jsonb := row_to_json(v_old)::jsonb;

  UPDATE public.enterprise_custom_plans SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    monthly_price_cents = COALESCE(p_monthly_price_cents, monthly_price_cents),
    yearly_price_cents = COALESCE(p_yearly_price_cents, yearly_price_cents),
    custom_features = COALESCE(p_custom_features, custom_features),
    max_users = COALESCE(p_max_users, max_users),
    max_obras = COALESCE(p_max_obras, max_obras),
    status = COALESCE(p_status, status),
    internal_notes = COALESCE(p_internal_notes, internal_notes),
    stripe_product_id = COALESCE(p_stripe_product_id, stripe_product_id),
    stripe_price_id_monthly = COALESCE(p_stripe_price_id_monthly, stripe_price_id_monthly),
    stripe_price_id_yearly = COALESCE(p_stripe_price_id_yearly, stripe_price_id_yearly),
    updated_at = NOW()
  WHERE id = p_plan_id;

  -- Registrar auditoria
  SELECT row_to_json(t)::jsonb INTO v_new_jsonb
  FROM (SELECT * FROM public.enterprise_custom_plans WHERE id = p_plan_id) t;

  INSERT INTO public.enterprise_plan_audit_log (plan_id, action, changed_by, old_values, new_values)
  VALUES (p_plan_id, 'updated', auth.uid(), v_old_jsonb, v_new_jsonb);

  RETURN TRUE;
END;
$$;
