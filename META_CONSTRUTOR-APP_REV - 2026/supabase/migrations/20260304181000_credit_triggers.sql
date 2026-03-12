-- ============================================================================
-- TRIGGERS DE CONSUMO E RENOVAÇÃO DE CRÉDITOS
-- ============================================================================
-- 1. enforce_rdo_credit_limit: BEFORE INSERT em rdos (plano free)
-- 2. reset_free_plan_credits: renovação mensal (dia 05)
-- 3. pg_cron job para renovação automática
-- 4. Função auxiliar para inicializar créditos ao criar org
-- ============================================================================

-- ============================================
-- TRIGGER 1: Consumo de crédito ao criar RDO
-- ============================================
CREATE OR REPLACE FUNCTION enforce_rdo_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_plan_slug TEXT;
  v_monthly_rdos INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Obter org_id do RDO (via coluna obra_id -> obras.org_id)
  SELECT o.org_id INTO v_org_id
  FROM obras o
  WHERE o.id = NEW.obra_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Obra não encontrada ou sem organização vinculada';
  END IF;

  -- Verificar plano da org
  SELECT p.slug, p.monthly_rdos
  INTO v_plan_slug, v_monthly_rdos
  FROM subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  WHERE s.org_id = v_org_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se não tem subscription ativa, assume plano free
  IF v_plan_slug IS NULL THEN
    SELECT slug, monthly_rdos 
    INTO v_plan_slug, v_monthly_rdos
    FROM plans WHERE slug = 'free' LIMIT 1;
  END IF;

  -- Planos pagos: monthly_rdos IS NULL = ilimitado, libera sem restrição
  IF v_monthly_rdos IS NULL THEN
    RETURN NEW;
  END IF;

  -- Plano gratuito: verificar saldo de créditos
  SELECT rdo_credits_balance INTO v_current_balance
  FROM org_credits
  WHERE org_id = v_org_id
  FOR UPDATE; -- lock para evitar race condition

  -- Se não tem registro de créditos, criar com saldo inicial
  IF v_current_balance IS NULL THEN
    INSERT INTO org_credits (org_id, rdo_credits_balance, plan_type, last_reset)
    VALUES (v_org_id, 7, v_plan_slug, CURRENT_DATE)
    ON CONFLICT (org_id) DO NOTHING;
    
    SELECT rdo_credits_balance INTO v_current_balance
    FROM org_credits WHERE org_id = v_org_id;
  END IF;

  -- Verificar se tem créditos disponíveis
  IF v_current_balance < 1 THEN
    RAISE EXCEPTION 'Limite de RDOs atingido! Seu plano Gratuito permite 7 RDOs por mês. Faça upgrade para criar RDOs ilimitados.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Debitar crédito
  UPDATE org_credits
  SET rdo_credits_balance = rdo_credits_balance - 1,
      updated_at = NOW()
  WHERE org_id = v_org_id;

  -- Registrar transação
  INSERT INTO credit_transactions (
    org_id, transaction_type, amount, 
    balance_before, balance_after, 
    description, reference_id, reference_type
  ) VALUES (
    v_org_id, 'consumption', -1,
    v_current_balance, v_current_balance - 1,
    'Criação de RDO', NEW.id, 'rdo'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela rdos
DROP TRIGGER IF EXISTS trigger_enforce_rdo_credits ON rdos;
CREATE TRIGGER trigger_enforce_rdo_credits
  BEFORE INSERT ON rdos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_rdo_credit_limit();

-- ============================================
-- TRIGGER 2: Renovação mensal (dia 05)
-- ============================================
CREATE OR REPLACE FUNCTION reset_free_plan_credits()
RETURNS void AS $$
DECLARE
  v_org RECORD;
  v_monthly_rdos INTEGER;
BEGIN
  -- Buscar créditos do plano free
  SELECT monthly_rdos INTO v_monthly_rdos
  FROM plans WHERE slug = 'free' LIMIT 1;

  IF v_monthly_rdos IS NULL THEN
    v_monthly_rdos := 7; -- fallback seguro
  END IF;

  -- Para cada org com plano free
  FOR v_org IN
    SELECT oc.org_id, oc.rdo_credits_balance
    FROM org_credits oc
    WHERE oc.plan_type = 'free'
      AND (oc.last_reset IS NULL OR oc.last_reset < CURRENT_DATE)
  LOOP
    -- Registrar transação de renovação
    INSERT INTO credit_transactions (
      org_id, transaction_type, amount,
      balance_before, balance_after,
      description
    ) VALUES (
      v_org.org_id, 'renewal', v_monthly_rdos,
      v_org.rdo_credits_balance, v_monthly_rdos,
      'Renovação mensal de créditos (dia 05)'
    );

    -- Resetar saldo (NÃO acumula, reseta para 7)
    UPDATE org_credits
    SET rdo_credits_balance = v_monthly_rdos,
        last_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE org_id = v_org.org_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- pg_cron: agendar renovação todo dia 05
-- ============================================
-- NOTA: pg_cron precisa estar habilitado no Supabase
-- (Dashboard > Database > Extensions > pg_cron)
-- Se não estiver disponível, use uma Edge Function com cron externo.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  PERFORM cron.schedule(
    'reset-free-credits-monthly',
    '0 3 5 * *',  -- minuto 0, hora 3 UTC (00:00 BRT), dia 5
    'SELECT reset_free_plan_credits()'
  );
  
  RAISE NOTICE 'pg_cron configurado com sucesso para renovação mensal.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron não disponível (%). Configure renovação via Edge Function ou cron externo.', SQLERRM;
END $$;

-- ============================================
-- FUNÇÃO AUXILIAR: Inicializar créditos ao criar org
-- ============================================
CREATE OR REPLACE FUNCTION initialize_org_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Toda org nova começa com créditos do plano free
  INSERT INTO org_credits (org_id, rdo_credits_balance, plan_type, last_reset)
  VALUES (NEW.id, 7, 'free', CURRENT_DATE)
  ON CONFLICT (org_id) DO NOTHING;

  -- Registrar transação inicial
  INSERT INTO credit_transactions (
    org_id, transaction_type, amount,
    balance_before, balance_after,
    description
  ) VALUES (
    NEW.id, 'initial', 7, 0, 7,
    'Créditos iniciais ao criar organização'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_init_org_credits ON orgs;
CREATE TRIGGER trigger_init_org_credits
  AFTER INSERT ON orgs
  FOR EACH ROW
  EXECUTE FUNCTION initialize_org_credits();

-- ============================================
-- FUNÇÃO: Atualizar créditos ao mudar de plano
-- ============================================
CREATE OR REPLACE FUNCTION update_credits_on_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_plan_slug TEXT;
  v_new_monthly_rdos INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Só processa se a subscription ficou ativa
  IF NEW.status NOT IN ('active', 'trialing') THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do novo plano
  SELECT slug, monthly_rdos 
  INTO v_new_plan_slug, v_new_monthly_rdos
  FROM plans WHERE id = NEW.plan_id;

  -- Buscar saldo atual
  SELECT rdo_credits_balance INTO v_current_balance
  FROM org_credits WHERE org_id = NEW.org_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Atualizar tipo do plano nos créditos
  IF v_new_monthly_rdos IS NULL THEN
    -- Plano pago: setar saldo como 999999 (ilimitado)
    UPDATE org_credits
    SET plan_type = v_new_plan_slug,
        rdo_credits_balance = 999999,
        updated_at = NOW()
    WHERE org_id = NEW.org_id;

    INSERT INTO credit_transactions (
      org_id, transaction_type, amount,
      balance_before, balance_after,
      description
    ) VALUES (
      NEW.org_id, 'adjustment', 999999 - v_current_balance,
      v_current_balance, 999999,
      'Upgrade para plano ' || v_new_plan_slug || ' (RDOs ilimitados)'
    );
  ELSE
    -- Plano free: resetar para créditos do plano
    UPDATE org_credits
    SET plan_type = v_new_plan_slug,
        rdo_credits_balance = v_new_monthly_rdos,
        last_reset = CURRENT_DATE,
        updated_at = NOW()
    WHERE org_id = NEW.org_id;

    INSERT INTO credit_transactions (
      org_id, transaction_type, amount,
      balance_before, balance_after,
      description
    ) VALUES (
      NEW.org_id, 'adjustment', v_new_monthly_rdos - v_current_balance,
      v_current_balance, v_new_monthly_rdos,
      'Mudança para plano ' || v_new_plan_slug
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_credits_on_plan ON subscriptions;
CREATE TRIGGER trigger_update_credits_on_plan
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_on_plan_change();
