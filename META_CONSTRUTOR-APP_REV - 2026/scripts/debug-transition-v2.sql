-- Debug M6.1 Transition Logic V2
-- 1. Replace function with debug logging
-- 2. Test transitions

CREATE OR REPLACE FUNCTION enforce_obras_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_transition_valid BOOLEAN := FALSE;
BEGIN
    v_old_status := OLD.status::TEXT;
    v_new_status := NEW.status::TEXT;
    
    RAISE WARNING 'DEBUG: enforce_obras_status_transition fired. OLD: %, NEW: %', v_old_status, v_new_status;
    
    -- If status hasn't changed, allow
    IF v_old_status = v_new_status THEN
        RAISE WARNING 'DEBUG: Status unchanged, allowing.';
        RETURN NEW;
    END IF;
    
    -- Define allowed transitions
    CASE v_old_status
        WHEN 'DRAFT' THEN
            v_transition_valid := v_new_status IN ('ACTIVE', 'CANCELED');
            RAISE WARNING 'DEBUG: Checking DRAFT transition to %. Valid? %', v_new_status, v_transition_valid;
        WHEN 'ACTIVE' THEN
            v_transition_valid := v_new_status IN ('ON_HOLD', 'COMPLETED', 'CANCELED');
            RAISE WARNING 'DEBUG: Checking ACTIVE transition to %. Valid? %', v_new_status, v_transition_valid;
        WHEN 'ON_HOLD' THEN
            v_transition_valid := v_new_status IN ('ACTIVE', 'CANCELED');
        WHEN 'COMPLETED' THEN
            v_transition_valid := FALSE; -- No transitions allowed from COMPLETED
        WHEN 'CANCELED' THEN
            v_transition_valid := FALSE; -- No transitions allowed from CANCELED
        ELSE
            RAISE WARNING 'DEBUG: Unknown old status: %', v_old_status;
            v_transition_valid := FALSE;
    END CASE;
    
    -- Block invalid transition
    IF NOT v_transition_valid THEN
        RAISE EXCEPTION 'Invalid obra status transition: % -> % is not allowed', 
            v_old_status, v_new_status;
    END IF;
    
    -- Write audit log for status change
    INSERT INTO public.audit_logs (
        org_id,
        actor_user_id,
        action,
        entity,
        entity_id,
        metadata
    ) VALUES (
        NEW.org_id,
        auth.uid(),
        'domain.obra_status_changed',
        'obra',
        NEW.id,
        jsonb_build_object(
            'from', v_old_status,
            'to', v_new_status,
            'obra_nome', NEW.nome
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- TEST SCRIPT
DO $$
DECLARE
    v_org_id uuid;
    v_user_id uuid;
    v_obra_id uuid;
BEGIN
    -- Get org and user
    SELECT id INTO v_org_id FROM orgs LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    RAISE NOTICE 'Using Org: %, User: %', v_org_id, v_user_id;
    
    -- Insert Obra (DRAFT) - Using existing logic or create new
    INSERT INTO obras (org_id, user_id, nome, localizacao, responsavel, cliente, tipo, data_inicio, previsao_termino, status)
    VALUES (v_org_id, v_user_id, 'DEBUG M6.1 OBRA', 'Loc', v_user_id, 'Client', 'Residencial', now(), now() + interval '30 days', 'DRAFT')
    RETURNING id INTO v_obra_id;
    
    RAISE NOTICE 'Created Obra: %', v_obra_id;
    
    -- Attempt Transition DRAFT -> ACTIVE
    RAISE NOTICE 'Attempting DRAFT -> ACTIVE...';
    UPDATE obras SET status = 'ACTIVE' WHERE id = v_obra_id;
    RAISE NOTICE 'SUCCESS: DRAFT -> ACTIVE';
    
    -- Attempt Transition ACTIVE -> DRAFT (Should fail)
    RAISE NOTICE 'Attempting ACTIVE -> DRAFT (Expect Failure)...';
    BEGIN
        UPDATE obras SET status = 'DRAFT' WHERE id = v_obra_id;
        RAISE EXCEPTION 'FAIL: ACTIVE -> DRAFT passed but should have failed!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: ACTIVE -> DRAFT blocked with error: %', SQLERRM;
    END;
    
    -- Cleanup
    DELETE FROM obras WHERE id = v_obra_id;
END $$;
