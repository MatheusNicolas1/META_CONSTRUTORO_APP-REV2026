-- ============================================================================
-- PRD06: MÓDULO 01.5 — Saque via PIX para Afiliados
-- ============================================================================
-- Tabela de solicitações de saque + RPC para criar solicitação
-- ============================================================================

-- ============================================================================
-- 1. affiliate_pix_requests — Solicitações de saque via PIX
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_pix_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL CHECK (amount >= 10.00),         -- Valor solicitado (mínimo R$ 10)
    pix_key text NOT NULL,                                          -- Chave PIX (CPF, CNPJ, email, telefone, aleatória)
    pix_key_type text NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
    pix_holder_name text NOT NULL DEFAULT '',                       -- Nome do titular (opcional, preenchido se chave for aleatória)
    pix_city text NOT NULL DEFAULT '',                              -- Cidade do titular (opcional)
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
    admin_notes text DEFAULT '',                                    -- Observações do admin (motivo de rejeição, etc.)
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,                                       -- Quando foi pago/rejeitado
    processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- Admin que processou
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pix_requests_affiliate_id ON public.affiliate_pix_requests(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_pix_requests_status ON public.affiliate_pix_requests(status);
CREATE INDEX IF NOT EXISTS idx_pix_requests_requested_at ON public.affiliate_pix_requests(requested_at);

COMMENT ON TABLE public.affiliate_pix_requests IS 'Solicitações de saque via PIX dos afiliados. Status: pending → approved → processing → completed | rejected.';
COMMENT ON COLUMN public.affiliate_pix_requests.pix_key IS 'Chave PIX do afiliado para receber o pagamento.';
COMMENT ON COLUMN public.affiliate_pix_requests.pix_key_type IS 'Tipo da chave PIX: cpf, cnpj, email, phone, random.';
COMMENT ON COLUMN public.affiliate_pix_requests.amount IS 'Valor solicitado para saque. Mínimo de R$ 10,00.';

-- ============================================================================
-- 2. Função: RPC para solicitar saque (chamada pelo frontend autenticado)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.request_affiliate_pix_withdrawal(
    p_amount numeric,
    p_pix_key text,
    p_pix_key_type text,
    p_pix_holder_name text DEFAULT '',
    p_pix_city text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id uuid;
    v_affiliate_user_id uuid;
    v_balance numeric(12,2);
    v_pix_request_id uuid;
    v_pending_count integer;
BEGIN
    -- Validar autenticação
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Validar valor mínimo
    IF p_amount < 10.00 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Valor mínimo para saque é R$ 10,00');
    END IF;

    -- Validar chave PIX
    IF p_pix_key IS NULL OR length(trim(p_pix_key)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Chave PIX é obrigatória');
    END IF;

    IF p_pix_key_type NOT IN ('cpf', 'cnpj', 'email', 'phone', 'random') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tipo de chave PIX inválido');
    END IF;

    -- Validar formato básico da chave
    IF p_pix_key_type = 'cpf' AND p_pix_key !~ '^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Formato de CPF inválido');
    END IF;

    IF p_pix_key_type = 'cnpj' AND p_pix_key !~ '^\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Formato de CNPJ inválido');
    END IF;

    IF p_pix_key_type = 'email' AND p_pix_key !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Formato de e-mail inválido');
    END IF;

    IF p_pix_key_type = 'phone' AND p_pix_key !~ '^\+?\d{10,15}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Formato de telefone inválido (use +55XXXXXXXXXXX)');
    END IF;

    -- Buscar perfil do afiliado
    SELECT id, user_id INTO v_affiliate_id, v_affiliate_user_id
    FROM public.affiliate_profiles
    WHERE user_id = auth.uid() AND status = 'active';

    IF v_affiliate_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Perfil de afiliado não encontrado ou inativo');
    END IF;

    -- Verificar se já existe solicitação pendente
    SELECT COUNT(*) INTO v_pending_count
    FROM public.affiliate_pix_requests
    WHERE affiliate_id = v_affiliate_id AND status IN ('pending', 'approved', 'processing');

    IF v_pending_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você já possui uma solicitação de saque em andamento. Aguarde o processamento.');
    END IF;

    -- Calcular saldo disponível (comissões com status 'paid')
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM public.affiliate_commissions
    WHERE affiliate_id = v_affiliate_id AND status = 'paid';

    -- Verificar saldo
    IF v_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Saldo insuficiente. Disponível: R$ %s, Solicitado: R$ %s', v_balance, p_amount),
            'balance', v_balance
        );
    END IF;

    -- Criar solicitação
    INSERT INTO public.affiliate_pix_requests (
        affiliate_id,
        amount,
        pix_key,
        pix_key_type,
        pix_holder_name,
        pix_city
    ) VALUES (
        v_affiliate_id,
        p_amount,
        trim(p_pix_key),
        p_pix_key_type,
        COALESCE(p_pix_holder_name, ''),
        COALESCE(p_pix_city, '')
    ) RETURNING id INTO v_pix_request_id;

    -- Marcar comissões como "processing" (reservadas para este saque)
    UPDATE public.affiliate_commissions
    SET status = 'processing'
    WHERE affiliate_id = v_affiliate_id
      AND status = 'paid'
      AND id IN (
          SELECT id FROM public.affiliate_commissions
          WHERE affiliate_id = v_affiliate_id AND status = 'paid'
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
      )
      AND amount <= (
          -- Reservar apenas o necessário
          SELECT COALESCE(SUM(amount), 0) FROM (
              SELECT amount FROM public.affiliate_commissions
              WHERE affiliate_id = v_affiliate_id AND status = 'paid'
              ORDER BY created_at ASC
          ) sub
          WHERE sub.amount IS NOT NULL
          AND (SELECT SUM(amount) FROM (
              SELECT amount FROM public.affiliate_commissions
              WHERE affiliate_id = v_affiliate_id AND status = 'paid'
              ORDER BY created_at ASC
          ) sub2 WHERE sub2.amount IS NOT NULL AND sub2.amount <= (
              SELECT SUM(sub3.amount) FROM (
                  SELECT amount FROM public.affiliate_commissions WHERE affiliate_id = v_affiliate_id AND status = 'paid' ORDER BY created_at ASC
              ) sub3 WHERE sub3.amount IS NOT NULL
          )) >= p_amount
      );

    RETURN jsonb_build_object(
        'success', true,
        'pix_request_id', v_pix_request_id,
        'amount', p_amount,
        'status', 'pending'
    );
END;
$$;

COMMENT ON FUNCTION public.request_affiliate_pix_withdrawal IS 'Solicita saque via PIX. Valida saldo, chave PIX, e cria solicitação. Usuário precisa estar autenticado.';

-- ============================================================================
-- 3. Função: admin aprovar saque
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_approve_pix_withdrawal(
    p_pix_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_request record;
BEGIN
    -- Verificar se é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users_view au
        WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
    END IF;

    -- Buscar solicitação
    SELECT * INTO v_request
    FROM public.affiliate_pix_requests
    WHERE id = p_pix_request_id AND status = 'pending';

    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada ou já processada');
    END IF;

    -- Atualizar status
    UPDATE public.affiliate_pix_requests
    SET status = 'approved',
        processed_at = now(),
        processed_by = auth.uid()
    WHERE id = p_pix_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'pix_request_id', p_pix_request_id,
        'status', 'approved',
        'amount', v_request.amount
    );
END;
$$;

-- ============================================================================
-- 4. Função: admin marcar como concluído (PIX enviado)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_complete_pix_withdrawal(
    p_pix_request_id uuid,
    p_pix_end_to_end_id text DEFAULT ''  -- ID da transação PIX no banco
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_request record;
    v_affiliate_id uuid;
BEGIN
    -- Verificar se é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users_view au
        WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
    END IF;

    -- Buscar solicitação
    SELECT * INTO v_request
    FROM public.affiliate_pix_requests
    WHERE id = p_pix_request_id AND status IN ('approved', 'processing');

    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada ou já concluída');
    END IF;

    -- Marcar como concluído
    UPDATE public.affiliate_pix_requests
    SET status = 'completed',
        processed_at = now(),
        processed_by = auth.uid()
    WHERE id = p_pix_request_id;

    -- Marcar comissões como &quot;paid&quot; (já estavam &quot;processing&quot;)
    UPDATE public.affiliate_commissions
    SET status = 'paid',
        paid_at = now()
    WHERE affiliate_id = v_request.affiliate_id
      AND status = 'processing';

    RETURN jsonb_build_object(
        'success', true,
        'pix_request_id', p_pix_request_id,
        'status', 'completed'
    );
END;
$$;

-- ============================================================================
-- 5. Função: admin rejeitar saque
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_reject_pix_withdrawal(
    p_pix_request_id uuid,
    p_reason text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_request record;
BEGIN
    -- Verificar se é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users_view au
        WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
    END IF;

    -- Buscar solicitação
    SELECT * INTO v_request
    FROM public.affiliate_pix_requests
    WHERE id = p_pix_request_id AND status IN ('pending', 'approved');

    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada ou já processada');
    END IF;

    -- Rejeitar
    UPDATE public.affiliate_pix_requests
    SET status = 'rejected',
        admin_notes = COALESCE(p_reason, ''),
        processed_at = now(),
        processed_by = auth.uid()
    WHERE id = p_pix_request_id;

    -- Liberar comissões de volta para "paid"
    UPDATE public.affiliate_commissions
    SET status = 'paid'
    WHERE affiliate_id = v_request.affiliate_id
      AND status = 'processing';

    RETURN jsonb_build_object(
        'success', true,
        'pix_request_id', p_pix_request_id,
        'status', 'rejected'
    );
END;
$$;

-- ============================================================================
-- 6. RLS: affiliate_pix_requests
-- ============================================================================
ALTER TABLE public.affiliate_pix_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: afiliado vê suas solicitações; admin vê todas
DROP POLICY IF EXISTS "pix_requests_select_policy" ON public.affiliate_pix_requests;
CREATE POLICY "pix_requests_select_policy"
    ON public.affiliate_pix_requests FOR SELECT
    USING (
        affiliate_id IN (
            SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_users_view au
            WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
        )
    );

-- INSERT: apenas via RPC (service_role)
DROP POLICY IF EXISTS "pix_requests_insert_policy" ON public.affiliate_pix_requests;
CREATE POLICY "pix_requests_insert_policy"
    ON public.affiliate_pix_requests FOR INSERT
    WITH CHECK (false);

-- UPDATE: apenas admin
DROP POLICY IF EXISTS "pix_requests_update_policy" ON public.affiliate_pix_requests;
CREATE POLICY "pix_requests_update_policy"
    ON public.affiliate_pix_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users_view au
            WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
        )
    );

-- DELETE: apenas admin
DROP POLICY IF EXISTS "pix_requests_delete_policy" ON public.affiliate_pix_requests;
CREATE POLICY "pix_requests_delete_policy"
    ON public.affiliate_pix_requests FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users_view au
            WHERE au.id = auth.uid() AND au.roles && ARRAY['president', 'finance']::text[]
        )
    );
