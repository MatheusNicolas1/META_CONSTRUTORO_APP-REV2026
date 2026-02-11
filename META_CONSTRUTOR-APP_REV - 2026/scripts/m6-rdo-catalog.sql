-- RDO Catalog Evidence
SELECT policyname, cmd FROM pg_policies WHERE tablename='rdos' ORDER BY policyname;
SELECT tgname FROM pg_trigger WHERE tgrelid='public.rdos'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT indexname FROM pg_indexes WHERE tablename='rdos' ORDER BY indexname;
