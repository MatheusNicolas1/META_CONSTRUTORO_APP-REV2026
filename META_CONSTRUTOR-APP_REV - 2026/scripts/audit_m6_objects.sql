-- Audit M6 Objects for PRD Evidence
-- Run this and use output to populate PRD

\echo '=== 6.3 RDO OBJECTS ==='
\d+ public.rdos
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'rdos';
SELECT tgname FROM pg_trigger WHERE tgrelid='public.rdos'::regclass AND NOT tgisinternal;
SELECT indexname, indexdef FROM pg_indexes WHERE tablename='rdos';

\echo '=== 6.4 QUALITY OBJECTS ==='
\d+ public.quality_items
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename IN ('quality_checklists', 'quality_items') ORDER BY tablename;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.quality_items'::regclass AND NOT tgisinternal;
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('quality_checklists', 'quality_items');

\echo '=== 6.5 AUDIT LOGS (SAMPLE) ==='
SELECT created_at, action, metadata 
FROM audit_logs 
WHERE action IN ('domain.rdo_status_changed', 'domain.quality_item_status_changed')
ORDER BY created_at DESC LIMIT 2;
