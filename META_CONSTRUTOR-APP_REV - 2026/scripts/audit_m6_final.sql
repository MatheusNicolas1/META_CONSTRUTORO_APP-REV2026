-- M6 Final Strict Audit
-- Capture real database object names and counts for PRD

\echo '=== 6.3 RDO EVIDENCE ==='
\d+ public.rdos
SELECT tablename, policyname, permissive FROM pg_policies WHERE tablename = 'rdos';
SELECT tgname FROM pg_trigger WHERE tgrelid='public.rdos'::regclass AND NOT tgisinternal;
SELECT indexname FROM pg_indexes WHERE tablename='rdos';
SELECT COUNT(*) as rdo_count FROM public.rdos;

\echo '=== 6.4 QUALITY EVIDENCE ==='
\d+ public.quality_checklists
\d+ public.quality_items
SELECT tablename, policyname, permissive FROM pg_policies WHERE tablename IN ('quality_checklists', 'quality_items') ORDER BY tablename;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.quality_items'::regclass AND NOT tgisinternal;
SELECT indexname FROM pg_indexes WHERE tablename IN ('quality_checklists', 'quality_items');

\echo '=== 6.5 SECURITY EVIDENCE ==='
-- Proving isolation via RLS existence (captured above)
-- Proving trigger block via existence (captured above)
