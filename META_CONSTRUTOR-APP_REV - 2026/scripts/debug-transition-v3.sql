-- Debug M6.1 Transition Logic V3 (Plain SQL)

-- 1. Replace function with debug logging
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

-- 2. Create test data (using CTE to handle UUIDs)
-- Disable limit trigger temporarily
ALTER TABLE obras DISABLE TRIGGER trigger_enforce_max_obras;

WITH org AS (SELECT id FROM orgs LIMIT 1),
     usr AS (SELECT id FROM auth.users LIMIT 1),
print_vals AS (
    SELECT org.id as oid, usr.id as uid FROM org, usr
),
inserted AS (
        INSERT INTO obras (org_id, user_id, nome, localizacao, responsavel, cliente, tipo, data_inicio, previsao_termino, status)
        SELECT oid, uid, 'DEBUG M6.1 SQL', 'Loc', uid, 'Client', 'Residencial', now(), now() + interval '30 days', 'DRAFT'
        FROM print_vals
        RETURNING id
     )
SELECT id AS new_obra_id FROM inserted;

-- Re-enable not strictly needed for this debug session but good practice
-- ALTER TABLE obras ENABLE TRIGGER trigger_enforce_max_obras;

-- 3. Attempt Update DRAFT -> ACTIVE
UPDATE obras 
SET status = 'ACTIVE' 
WHERE nome = 'DEBUG M6.1 SQL';

-- 4. Verify result
SELECT id, status FROM obras WHERE nome = 'DEBUG M6.1 SQL';

-- 5. Attempt Invalid Update ACTIVE -> DRAFT (fail expected)
-- We use DO block just for this one to catch exception if possible, or just let it fail script
UPDATE obras 
SET status = 'DRAFT' 
WHERE nome = 'DEBUG M6.1 SQL';

-- Cleanup
DELETE FROM obras WHERE nome = 'DEBUG M6.1 SQL';
