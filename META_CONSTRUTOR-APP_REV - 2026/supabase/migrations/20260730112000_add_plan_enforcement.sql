-- ============================================================================
-- MIGRATION: Add Plan Enforcement
-- Adiciona coluna max_rdo à tabela plans + trigger para limite de obras
-- ============================================================================

-- 1. Adicionar coluna max_rdo à tabela plans (se não existir)
ALTER TABLE IF EXISTS public.plans
  ADD COLUMN IF NOT EXISTS max_rdo INTEGER;

COMMENT ON COLUMN public.plans.max_rdo IS 'Limite máximo de RDOs por mês. NULL = ilimitado.';

-- 2. Atualizar planos existentes com valores de max_rdo
-- Free: 7 RDOs/mês, Básico/Professional/Master: ilimitado (NULL)
UPDATE public.plans
  SET max_rdo = CASE
    WHEN slug = 'free' THEN 7
    ELSE NULL  -- Básico, Professional, Master = ilimitado
  END
  WHERE max_rdo IS NULL;

-- 3. Atualizar max_users e max_obras para garantir consistência com planLimits.ts
UPDATE public.plans
  SET
    max_users = CASE
      WHEN slug = 'free' THEN 1
      WHEN slug = 'basico' THEN 3
      WHEN slug = 'professional' THEN 10
      WHEN slug = 'master' THEN NULL  -- ilimitado
      ELSE max_users
    END,
    max_obras = CASE
      WHEN slug = 'free' THEN 1
      WHEN slug = 'basico' THEN 2
      WHEN slug = 'professional' THEN 10
      WHEN slug = 'master' THEN NULL  -- ilimitado
      ELSE max_obras
    END
  WHERE slug IN ('free', 'basico', 'professional', 'master');

-- ============================================================================
-- TRIGGER: Limite de obras por plano (check_before_insert_obra)
-- Impede criação de obra quando o plano da organização já atingiu o limite
-- ============================================================================

-- 4. Função de trigger para verificar limite de obras
CREATE OR REPLACE FUNCTION public.check_obra_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_obras INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Buscar o limite de obras do plano da organização
  SELECT COALESCE(p.max_obras, -1) INTO v_max_obras
  FROM public.plans p
  WHERE p.id = (
    SELECT COALESCE(s.plan_id, (SELECT id FROM public.plans WHERE slug = 'free'))
    FROM public.subscriptions s
    WHERE s.org_id = NEW.org_id
      AND s.status IN ('active', 'trialing')
    LIMIT 1
  );

  -- Se não achou subscription, usa plano free
  IF v_max_obras IS NULL THEN
    SELECT COALESCE(max_obras, -1) INTO v_max_obras
    FROM public.plans
    WHERE slug = 'free';
  END IF;

  -- -1 = ilimitado
  IF v_max_obras = -1 THEN
    RETURN NEW;
  END IF;

  -- Contar obras ativas da organização
  SELECT COUNT(*) INTO v_current_count
  FROM public.obras
  WHERE org_id = NEW.org_id;

  IF v_current_count >= v_max_obras THEN
    RAISE EXCEPTION 'Limite do plano atingido: máximo de % obra(s) ativa(s). Faça upgrade do plano para criar mais obras.', v_max_obras
      USING HINT = 'upgrade_plan';
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Aplicar trigger na tabela obras (BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_check_obra_limit ON public.obras;
CREATE TRIGGER trg_check_obra_limit
  BEFORE INSERT ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.check_obra_limit();

-- ============================================================================
-- TRIGGER: Limite de membros por plano (check_before_insert_org_member)
-- Proteção extra no banco para limite de membros
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_org_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_users INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Buscar o limite de usuários do plano
  SELECT COALESCE(p.max_users, -1) INTO v_max_users
  FROM public.plans p
  WHERE p.id = (
    SELECT COALESCE(s.plan_id, (SELECT id FROM public.plans WHERE slug = 'free'))
    FROM public.subscriptions s
    WHERE s.org_id = NEW.org_id
      AND s.status IN ('active', 'trialing')
    LIMIT 1
  );

  -- Se não achou subscription, usa plano free
  IF v_max_users IS NULL THEN
    SELECT COALESCE(max_users, -1) INTO v_max_users
    FROM public.plans
    WHERE slug = 'free';
  END IF;

  -- -1 = ilimitado
  IF v_max_users = -1 THEN
    RETURN NEW;
  END IF;

  -- Só verifica quando o status é 'active' (membro ativado)
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.org_members
    WHERE org_id = NEW.org_id
      AND status = 'active';

    IF v_current_count >= v_max_users THEN
      RAISE EXCEPTION 'Limite do plano atingido: máximo de % usuário(s) ativo(s). Faça upgrade do plano para adicionar mais membros.', v_max_users
        USING HINT = 'upgrade_plan';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Aplicar trigger na tabela org_members (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trg_check_org_member_limit ON public.org_members;
CREATE TRIGGER trg_check_org_member_limit
  BEFORE INSERT OR UPDATE OF status ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_org_member_limit();

-- ============================================================================
-- TRIGGER: Limite de RDOs por mês (check_before_insert_rdo)
-- Impede criação de RDO quando o plano já atingiu o limite mensal
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_rdo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_rdo INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Buscar o limite de RDOs do plano
  SELECT COALESCE(p.max_rdo, -1) INTO v_max_rdo
  FROM public.plans p
  WHERE p.id = (
    SELECT COALESCE(s.plan_id, (SELECT id FROM public.plans WHERE slug = 'free'))
    FROM public.subscriptions s
    WHERE s.org_id = NEW.org_id
      AND s.status IN ('active', 'trialing')
    LIMIT 1
  );

  -- Se não achou subscription, usa plano free
  IF v_max_rdo IS NULL THEN
    SELECT COALESCE(max_rdo, -1) INTO v_max_rdo
    FROM public.plans
    WHERE slug = 'free';
  END IF;

  -- -1 = ilimitado
  IF v_max_rdo = -1 THEN
    RETURN NEW;
  END IF;

  -- Contar RDOs do mês corrente para a organização
  SELECT COUNT(*) INTO v_current_count
  FROM public.rdos
  WHERE org_id = NEW.org_id
    AND created_at >= date_trunc('month', NOW());

  IF v_current_count >= v_max_rdo THEN
    RAISE EXCEPTION 'Limite do plano atingido: máximo de % RDO(s) por mês. Faça upgrade do plano para continuar usando.', v_max_rdo
      USING HINT = 'upgrade_plan';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Aplicar trigger na tabela rdos (BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_check_rdo_limit ON public.rdos;
CREATE TRIGGER trg_check_rdo_limit
  BEFORE INSERT ON public.rdos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_rdo_limit();
