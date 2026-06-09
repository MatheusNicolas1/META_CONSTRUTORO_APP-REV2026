-- ============================================================================
-- PRD06: MÓDULO 01 — Programa de Afiliados (Banco de Dados)
-- ============================================================================
-- 4 tabelas: affiliate_profiles, affiliate_clicks, affiliate_referrals, affiliate_commissions
-- ============================================================================

-- ============================================================================
-- 1. affiliate_profiles — Perfil de afiliado de cada usuário
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
    total_clicks integer NOT NULL DEFAULT 0,
    total_referrals integer NOT NULL DEFAULT 0,
    total_commissions numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT affiliate_code_format CHECK (affiliate_code ~ '^MC[A-Z0-9]{8}$'),
    CONSTRAINT affiliate_profiles_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON public.affiliate_profiles(status);

-- ============================================================================
-- 2. affiliate_clicks — Cliques no link de afiliado (rastreamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    visitor_ip text NOT NULL,
    visitor_agent text DEFAULT '',
    referrer_url text DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_visitor_ip ON public.affiliate_clicks(visitor_ip);

-- ============================================================================
-- 3. affiliate_referrals — Indicações (vínculo entre afiliado e indicado)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    referred_email text NOT NULL,
    subscription_id text DEFAULT '',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled', 'refunded')),
    created_at timestamptz NOT NULL DEFAULT now(),
    converted_at timestamptz,
    cancelled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user ON public.affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_email ON public.affiliate_referrals(referred_email);

-- ============================================================================
-- 4. affiliate_commissions — Comissões geradas por pagamentos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
    subscription_id text NOT NULL,
    stripe_invoice_id text DEFAULT '',
    gross_amount numeric(12,2) NOT NULL,        -- Valor bruto pago
    net_amount numeric(12,2) NOT NULL,           -- Valor líquido (após taxas Stripe)
    amount numeric(12,2) NOT NULL,               -- Comissão (40% do net_amount)
    percentage integer NOT NULL DEFAULT 40 CHECK (percentage = 40),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'refunded')),
    created_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    paid_at timestamptz,
    cancelled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON public.affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_subscription ON public.affiliate_commissions(subscription_id);

-- ============================================================================
-- 5. Função para gerar código de afiliado no formato MCXXXXXXXX
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    code text;
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
BEGIN
    LOOP
        code := 'MC';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_profiles WHERE affiliate_code = code);
    END LOOP;
    RETURN code;
END;
$$;

-- ============================================================================
-- 6. Trigger: criar perfil de afiliado automaticamente ao criar usuário
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_affiliate_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
    VALUES (NEW.id, public.generate_affiliate_code());
    RETURN NEW;
END;
$$;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;
CREATE TRIGGER on_auth_user_created_affiliate
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_affiliate_profile();

-- ============================================================================
-- 7. Trigger: backfill para usuários existentes sem perfil de afiliado
-- ============================================================================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT u.id
        FROM auth.users u
        LEFT JOIN public.affiliate_profiles ap ON ap.user_id = u.id
        WHERE ap.id IS NULL
    LOOP
        INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
        VALUES (user_record.id, public.generate_affiliate_code());
    END LOOP;
END $$;

-- ============================================================================
-- 8. Trigger: atualizar updated_at
-- ============================================================================
CREATE TRIGGER update_affiliate_profiles_updated_at
    BEFORE UPDATE ON public.affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. Comentários de documentação
-- ============================================================================
COMMENT ON TABLE public.affiliate_profiles IS 'Perfis de afiliados. Cada usuário tem um código único permanente.';
COMMENT ON TABLE public.affiliate_clicks IS 'Cliques nos links de afiliado para rastreamento de tráfego.';
COMMENT ON TABLE public.affiliate_referrals IS 'Indicações. Vincula um usuário indicado ao afiliado que o trouxe.';
COMMENT ON TABLE public.affiliate_commissions IS 'Comissões geradas por pagamentos de assinaturas de indicados.';
COMMENT ON COLUMN public.affiliate_commissions.percentage IS 'Percentual fixo da comissão: 40% do valor líquido.';

-- ============================================================================
-- 10. Função: incrementar contador de cliques do afiliado
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.affiliate_profiles
    SET total_clicks = total_clicks + 1
    WHERE id = p_affiliate_id;
END;
$$;

-- ============================================================================
-- 11. Função: processar referral ao criar conta (cookie)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_affiliate_referral(
    p_affiliate_code text,
    p_referred_email text,
    p_referred_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id uuid;
    v_affiliate_user_id uuid;
    v_referral_id uuid;
BEGIN
    -- Encontrar o afiliado pelo código
    SELECT id, user_id INTO v_affiliate_id, v_affiliate_user_id
    FROM public.affiliate_profiles
    WHERE affiliate_code = p_affiliate_code AND status = 'active';

    IF v_affiliate_id IS NULL THEN
        RAISE EXCEPTION 'Affiliate code not found or inactive' USING ERRCODE = 'AF001';
    END IF;

    -- Anti-self-referral
    IF NOT public.check_anti_self_referral(
        v_affiliate_user_id,
        p_referred_email,
        p_referred_user_id
    ) THEN
        RAISE EXCEPTION 'Self-referral not allowed' USING ERRCODE = 'AF002';
    END IF;

    -- Verificar se este email já não foi indicado por outro afiliado
    IF EXISTS (
        SELECT 1 FROM public.affiliate_referrals
        WHERE referred_email = p_referred_email
          AND status IN ('pending', 'converted')
    ) THEN
        RAISE EXCEPTION 'Email already referred' USING ERRCODE = 'AF003';
    END IF;

    -- Criar referral
    INSERT INTO public.affiliate_referrals (
        affiliate_id,
        referred_user_id,
        referred_email,
        status
    ) VALUES (
        v_affiliate_id,
        p_referred_user_id,
        p_referred_email,
        'pending'
    ) RETURNING id INTO v_referral_id;

    -- Incrementar contador de indicações
    UPDATE public.affiliate_profiles
    SET total_referrals = total_referrals + 1
    WHERE id = v_affiliate_id;

    RETURN v_referral_id;
END;
$$;

COMMENT ON FUNCTION public.process_affiliate_referral IS 'Processa uma indicação de afiliado. Verifica anti-self-referral, duplicidade de email, e cria o registro.';

-- ============================================================================
-- 12. Função: gerar comissão a partir de pagamento aprovado
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_affiliate_commission(
    p_referral_id uuid,
    p_subscription_id text,
    p_stripe_invoice_id text,
    p_gross_amount numeric,
    p_net_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id uuid;
    v_commission_id uuid;
    v_percentage integer := 40;
    v_amount numeric;
BEGIN
    -- Buscar o affiliate_id do referral
    SELECT affiliate_id INTO v_affiliate_id
    FROM public.affiliate_referrals
    WHERE id = p_referral_id;

    IF v_affiliate_id IS NULL THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'AF010';
    END IF;

    -- Calcular comissão: 40% do valor líquido
    v_amount := ROUND(p_net_amount * v_percentage / 100, 2);

    -- Atualizar referral para 'converted'
    UPDATE public.affiliate_referrals
    SET status = 'converted',
        converted_at = now(),
        subscription_id = p_subscription_id
    WHERE id = p_referral_id AND status = 'pending';

    -- Criar comissão
    INSERT INTO public.affiliate_commissions (
        affiliate_id,
        referral_id,
        subscription_id,
        stripe_invoice_id,
        gross_amount,
        net_amount,
        amount,
        percentage,
        status
    ) VALUES (
        v_affiliate_id,
        p_referral_id,
        p_subscription_id,
        p_stripe_invoice_id,
        p_gross_amount,
        p_net_amount,
        v_amount,
        v_percentage,
        'pending'
    ) RETURNING id INTO v_commission_id;

    -- Atualizar total de comissões no perfil do afiliado
    UPDATE public.affiliate_profiles
    SET total_commissions = total_commissions + v_amount
    WHERE id = v_affiliate_id;

    RETURN v_commission_id;
END;
$$;

COMMENT ON FUNCTION public.generate_affiliate_commission IS 'Gera comissão de 40% sobre o valor líquido pago. Chamado pelo webhook Stripe após pagamento confirmado.';

-- ============================================================================
-- 13. Função: cancelar comissão (cancelamento/reembolso)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_affiliate_commission(
    p_stripe_invoice_id text,
    p_reason text DEFAULT 'refunded'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_commission_id uuid;
    v_affiliate_id uuid;
    v_amount numeric;
BEGIN
    -- Encontrar comissão pela invoice Stripe
    SELECT id, affiliate_id, amount INTO v_commission_id, v_affiliate_id, v_amount
    FROM public.affiliate_commissions
    WHERE stripe_invoice_id = p_stripe_invoice_id
      AND status IN ('pending', 'approved');

    IF v_commission_id IS NULL THEN
        RETURN; -- Nothing to cancel, no error
    END IF;

    -- Atualizar comissão
    UPDATE public.affiliate_commissions
    SET status = CASE
            WHEN p_reason = 'refunded' THEN 'refunded'
            ELSE 'cancelled'
        END,
        cancelled_at = now()
    WHERE id = v_commission_id;

    -- Atualizar referral
    UPDATE public.affiliate_referrals
    SET status = CASE
            WHEN p_reason = 'refunded' THEN 'refunded'
            ELSE 'cancelled'
        END,
        cancelled_at = now()
    WHERE id = (
        SELECT referral_id FROM public.affiliate_commissions WHERE id = v_commission_id
    );

    -- Debitar do total
    UPDATE public.affiliate_profiles
    SET total_commissions = GREATEST(0, total_commissions - v_amount)
    WHERE id = v_affiliate_id;
END;
$$;

COMMENT ON FUNCTION public.cancel_affiliate_commission IS 'Cancela/remove comissão por cancelamento ou reembolso. Chamado pelo webhook Stripe.';
