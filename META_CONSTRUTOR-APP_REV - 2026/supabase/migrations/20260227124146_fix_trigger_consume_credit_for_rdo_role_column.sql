
-- ============================================================
-- FIX: consume_credit_for_rdo busca a role do usuário no
-- public.user_roles em vez de public.profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_credit_for_rdo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_plan_type TEXT;
  v_credits INTEGER;
BEGIN
  -- 1. Buscar role do usuário na tabela user_roles
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = NEW.criado_por_id
  LIMIT 1;

  -- 2. Presidente e Administrador têm acesso ilimitado — bypass total
  IF v_role IN ('Presidente', 'Administrador') THEN
    RETURN NEW;
  END IF;

  -- 3. Buscar plano e créditos do usuário
  SELECT plan_type, credits_balance
  INTO v_plan_type, v_credits
  FROM public.user_credits
  WHERE user_id = NEW.criado_por_id;

  -- 4. Se não encontrou registro de créditos, libera (novo usuário)
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- 5. Planos pagos (não free) têm acesso ilimitado
  IF v_plan_type IS DISTINCT FROM 'free' THEN
    RETURN NEW;
  END IF;

  -- 6. Plano free: verificar se tem créditos disponíveis
  IF v_credits <= 0 THEN
    RAISE EXCEPTION 'Créditos esgotados. Você atingiu o limite de RDOs gratuitos. Entre em contato para saber sobre os planos ilimitados.';
  END IF;

  -- 7. Consumir 1 crédito
  UPDATE public.user_credits
  SET credits_balance = GREATEST(credits_balance - 1, 0),
      updated_at = now()
  WHERE user_id = NEW.criado_por_id AND plan_type = 'free';

  RETURN NEW;
END;
$$;
;
