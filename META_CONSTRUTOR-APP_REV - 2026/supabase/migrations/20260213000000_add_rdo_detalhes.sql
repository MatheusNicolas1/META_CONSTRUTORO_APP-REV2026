-- Add detalhes column to rdos for storing extra form data
ALTER TABLE public.rdos 
ADD COLUMN IF NOT EXISTS detalhes JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.rdos.detalhes IS 'Stores extra RDO data like accidents, missing materials, etc.';
