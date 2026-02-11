-- Quality Catalog Evidence
\d+ public.quality_checklists
\d+ public.quality_items
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('quality_checklists','quality_items') ORDER BY tablename, policyname;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.quality_items'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT indexname FROM pg_indexes WHERE tablename IN ('quality_checklists','quality_items') ORDER BY tablename, indexname;
