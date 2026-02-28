-- Fix RDOS Schema to match Frontend/Product Requirements
-- 1. Add missing 'observacoes' column
-- 2. Fix 'equipe_ociosa' type (Text -> Boolean)

BEGIN;

-- 1. Add observacoes
ALTER TABLE public.rdos 
ADD COLUMN IF NOT EXISTS observacoes text;

-- 2. Fix equipe_ociosa type
-- Handle potential conversion errors by defaulting to false if null or invalid
ALTER TABLE public.rdos 
ALTER COLUMN equipe_ociosa TYPE boolean 
USING CASE 
    WHEN equipe_ociosa IS NULL THEN false 
    WHEN equipe_ociosa::text = 'true' THEN true 
    WHEN equipe_ociosa::text = 'false' THEN false 
    ELSE false 
END;

-- Set default false
ALTER TABLE public.rdos 
ALTER COLUMN equipe_ociosa SET DEFAULT false;

COMMIT;
