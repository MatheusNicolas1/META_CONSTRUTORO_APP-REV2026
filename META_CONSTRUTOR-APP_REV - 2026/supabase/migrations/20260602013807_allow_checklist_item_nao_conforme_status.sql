DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'checklist_item_status'
  ) THEN
    ALTER TYPE public.checklist_item_status ADD VALUE IF NOT EXISTS 'Não conforme';
  END IF;
END $$;

ALTER TABLE public.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_status_check;

ALTER TABLE public.checklist_items
  ADD CONSTRAINT checklist_items_status_check
  CHECK (status IN ('Não iniciado', 'Em andamento', 'Concluído', 'Não conforme', 'Não aplicável'));
