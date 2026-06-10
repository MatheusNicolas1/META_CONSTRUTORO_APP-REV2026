-- ============================================================================
-- PRD06: MÓDULO 09 — RLS Policies e Segurança (Programa de Afiliados)
-- ============================================================================
-- Anti-fraude, anti-autoindicação, proteção de dados LGPD
-- ============================================================================

-- ============================================================================
-- 1. RLS: affiliate_profiles
-- ============================================================================
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas seu próprio perfil; admin vê todos
DROP POLICY IF EXISTS "affiliate_profiles_select_policy" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_select_policy"
    ON public.affiliate_profiles FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- INSERT: apenas o trigger automático (service_role) pode inserir
DROP POLICY IF EXISTS "affiliate_profiles_insert_policy" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_insert_policy"
    ON public.affiliate_profiles FOR INSERT
    WITH CHECK (false); -- Apenas service_role via trigger

-- UPDATE: usuário pode atualizar apenas campos permitidos do próprio perfil
DROP POLICY IF EXISTS "affiliate_profiles_update_policy" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_update_policy"
    ON public.affiliate_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: apenas admin
DROP POLICY IF EXISTS "affiliate_profiles_delete_policy" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_delete_policy"
    ON public.affiliate_profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- ============================================================================
-- 2. RLS: affiliate_clicks
-- ============================================================================
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- SELECT: afiliado vê cliques do próprio link; admin vê todos
DROP POLICY IF EXISTS "affiliate_clicks_select_policy" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_select_policy"
    ON public.affiliate_clicks FOR SELECT
    USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- INSERT: permitido anonimamente via endpoint público (sem auth)
DROP POLICY IF EXISTS "affiliate_clicks_insert_policy" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_insert_policy"
    ON public.affiliate_clicks FOR INSERT
    WITH CHECK (true);

-- UPDATE/DELETE: apenas admin
DROP POLICY IF EXISTS "affiliate_clicks_update_policy" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_update_policy"
    ON public.affiliate_clicks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

DROP POLICY IF EXISTS "affiliate_clicks_delete_policy" ON public.affiliate_clicks;
CREATE POLICY "affiliate_clicks_delete_policy"
    ON public.affiliate_clicks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- ============================================================================
-- 3. RLS: affiliate_referrals
-- ============================================================================
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- SELECT: afiliado vê suas indicações; admin vê todas
DROP POLICY IF EXISTS "affiliate_referrals_select_policy" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_select_policy"
    ON public.affiliate_referrals FOR SELECT
    USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- INSERT: apenas backend (service_role) pode inserir
DROP POLICY IF EXISTS "affiliate_referrals_insert_policy" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_insert_policy"
    ON public.affiliate_referrals FOR INSERT
    WITH CHECK (false);

-- UPDATE: apenas backend (service_role) pode atualizar status
DROP POLICY IF EXISTS "affiliate_referrals_update_policy" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_update_policy"
    ON public.affiliate_referrals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- DELETE: apenas admin
DROP POLICY IF EXISTS "affiliate_referrals_delete_policy" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_delete_policy"
    ON public.affiliate_referrals FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- ============================================================================
-- 4. RLS: affiliate_commissions
-- ============================================================================
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- SELECT: afiliado vê apenas suas comissões; admin vê todas
DROP POLICY IF EXISTS "affiliate_commissions_select_policy" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_select_policy"
    ON public.affiliate_commissions FOR SELECT
    USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- INSERT: apenas backend (service_role)
DROP POLICY IF EXISTS "affiliate_commissions_insert_policy" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_insert_policy"
    ON public.affiliate_commissions FOR INSERT
    WITH CHECK (false);

-- UPDATE: apenas admin (para gerenciar status de pagamento)
DROP POLICY IF EXISTS "affiliate_commissions_update_policy" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_update_policy"
    ON public.affiliate_commissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- DELETE: apenas admin
DROP POLICY IF EXISTS "affiliate_commissions_delete_policy" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_delete_policy"
    ON public.affiliate_commissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE user_id = auth.uid() AND role = 'president'
        )
    );

-- ============================================================================
-- 5. VIEW: Dados públicos de afiliado (LGPD — sem dados sensíveis)
-- ============================================================================
-- Afiliados podem ver apenas: nome, plano, status, valor da comissão
-- NUNCA: CPF, telefone, endereço, dados financeiros, cartões
CREATE OR REPLACE VIEW public.affiliate_public_referrals AS
SELECT
    ar.id AS referral_id,
    ar.status AS referral_status,
    ar.created_at AS referred_at,
    COALESCE(p.name, 'Usuário') AS referred_name,
    COALESCE(p.plan_type, 'free') AS referred_plan,
    ac.amount AS commission_value,
    ac.status AS commission_status
FROM public.affiliate_referrals ar
LEFT JOIN public.profiles p ON p.id = ar.referred_user_id
LEFT JOIN public.affiliate_commissions ac ON ac.referral_id = ar.id
WHERE
    ar.affiliate_id IN (
        SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()
    );

COMMENT ON VIEW public.affiliate_public_referrals IS 'LGPD: Afiliado vê apenas nome, plano, status e valor. Sem CPF/telefone/endereço.';

-- ============================================================================
-- 6. Função: Verificação anti-autoindicação
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_anti_self_referral(
    p_affiliate_user_id uuid,
    p_referred_email text,
    p_referred_user_id uuid DEFAULT NULL,
    p_cpf_cnpj text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_self boolean := false;
BEGIN
    -- Verificação 1: Mesmo user_id
    IF p_referred_user_id IS NOT NULL AND p_referred_user_id = p_affiliate_user_id THEN
        v_is_self := true;
    END IF;

    -- Verificação 2: Mesmo email (comparar com email do afiliado no auth.users)
    IF NOT v_is_self AND p_referred_email IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = p_affiliate_user_id AND email = p_referred_email
        ) THEN
            v_is_self := true;
        END IF;
    END IF;

    -- Verificação 3: Mesmo CPF/CNPJ
    IF NOT v_is_self AND p_referred_user_id IS NOT NULL AND p_cpf_cnpj IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = p_referred_user_id AND cpf_cnpj = p_cpf_cnpj
        ) THEN
            v_is_self := true;
        END IF;
    END IF;

    -- Verificação 4: Mesmo Stripe Customer (se já existir)
    IF NOT v_is_self AND p_referred_user_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.profiles p1
            JOIN public.profiles p2 ON p2.stripe_customer_id IS NOT NULL
                AND p1.stripe_customer_id = p2.stripe_customer_id
            WHERE p1.id = p_referred_user_id
              AND p2.id = p_affiliate_user_id
              AND p1.stripe_customer_id IS NOT NULL
        ) THEN
            v_is_self := true;
        END IF;
    END IF;

    RETURN NOT v_is_self;
END;
$$;

COMMENT ON FUNCTION public.check_anti_self_referral IS 'Anti-fraude: verifica múltiplos fatores para bloquear autoindicação (mesmo user_id, email, CPF/CNPJ, Stripe Customer).';
