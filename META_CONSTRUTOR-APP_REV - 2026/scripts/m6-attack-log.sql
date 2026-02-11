-- M6 Attack Log Capture
-- Run to capture specific error messages for PRD evidence

DO $$
DECLARE
    v_org_id uuid;
    v_user_id uuid;
    v_obra_id uuid;
    v_rdo_id uuid;
    v_checklist_id uuid;
    v_item_id uuid;
BEGIN
    -- Context
    SELECT id, owner_user_id INTO v_org_id, v_user_id FROM orgs LIMIT 1;
    
    INSERT INTO obras (org_id, user_id, nome, localizacao, responsavel, cliente, tipo, data_inicio, previsao_termino, status)
    VALUES (v_org_id, v_user_id, 'ATTACK LOG OBRA', 'Loc', v_user_id, 'Cli', 'Residencial', now(), now() + interval '1 day', 'DRAFT')
    RETURNING id INTO v_obra_id;

    -- 1. RDO Attack
    INSERT INTO rdos (org_id, obra_id, user_id, data, periodo, clima, equipe_ociosa, status)
    VALUES (v_org_id, v_obra_id, v_user_id, now(), 'Tarde', 'Sol', 'Nao', 'DRAFT')
    RETURNING id INTO v_rdo_id;

    BEGIN
        UPDATE rdos SET status = 'APPROVED' WHERE id = v_rdo_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Captured RDO Error: %', SQLERRM;
    END;

    -- 2. Quality Attack
    INSERT INTO quality_checklists (org_id, obra_id, title)
    VALUES (v_org_id, v_obra_id, 'Attack List')
    RETURNING id INTO v_checklist_id;

    INSERT INTO quality_items (checklist_id, title, status)
    VALUES (v_checklist_id, 'Attack Item', 'PENDING')
    RETURNING id INTO v_item_id;

    BEGIN
        UPDATE quality_items SET status = 'REWORK_DONE' WHERE id = v_item_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Captured Quality Error: %', SQLERRM;
    END;

    -- Cleanup
    DELETE FROM quality_items WHERE checklist_id = v_checklist_id;
    DELETE FROM quality_checklists WHERE id = v_checklist_id;
    DELETE FROM rdos WHERE id = v_rdo_id;
    DELETE FROM obras WHERE id = v_obra_id;

END $$;
