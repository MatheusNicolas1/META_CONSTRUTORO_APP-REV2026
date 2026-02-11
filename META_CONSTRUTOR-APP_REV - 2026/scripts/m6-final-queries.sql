-- M6 Final Reproducible Queries
-- Run and copy output to PRD

\echo '--- 6.3 RDO CATALOG ---'
SELECT policyname, cmd FROM pg_policies WHERE tablename='rdos' ORDER BY policyname;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.rdos'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT indexname FROM pg_indexes WHERE tablename='rdos' ORDER BY indexname;

\echo '--- 6.4 QUALITY CATALOG ---'
\d+ public.quality_checklists
\d+ public.quality_items
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('quality_checklists','quality_items') ORDER BY tablename, policyname;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.quality_items'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT indexname FROM pg_indexes WHERE tablename IN ('quality_checklists','quality_items') ORDER BY tablename, indexname;

\echo '--- AUDIT LOG EVIDENCE ---'
SELECT created_at, action, entity, metadata
FROM public.audit_logs
WHERE action IN ('domain.rdo_status_changed','domain.quality_item_status_changed')
ORDER BY created_at DESC
LIMIT 5;

\echo '--- 6.5 ATTACK EVIDENCE (Simulated) ---'
-- Capturing errors from attack script
DO $$
DECLARE v_rdo_id uuid;
BEGIN
  -- Mock RDO ID (won't work if no data, but we want the ERROR message if possible, or just skip)
  -- Actually, let's just insert a dummy to trigger the error
  INSERT INTO rdos (org_id, obra_id, user_id, status) 
  SELECT id, (SELECT id FROM obras LIMIT 1), owner_user_id, 'DRAFT' FROM orgs LIMIT 1
  RETURNING id INTO v_rdo_id;
  
  UPDATE rdos SET status = 'APPROVED' WHERE id = v_rdo_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Captured RDO Error: %', SQLERRM;
END $$;

DO $$
DECLARE v_item_id uuid;
BEGIN
   -- Mock Item
   INSERT INTO quality_checklists (org_id, obra_id, title)
   SELECT id, (SELECT id FROM obras LIMIT 1), 'Attack Test' FROM orgs LIMIT 1
   RETURNING id INTO v_item_id; -- actually checklist id, but needed for item
   
   INSERT INTO quality_items (checklist_id, title, status)
   VALUES (v_item_id, 'Item Attack', 'PENDING')
   RETURNING id INTO v_item_id;

   UPDATE quality_items SET status = 'REWORK_DONE' WHERE id = v_item_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Captured Quality Error: %', SQLERRM;
END $$;
