-- ============================================================================
-- FIX: Add unique constraints to profiles table (cpf_cnpj, phone)
-- ============================================================================

-- Create unique index on cpf_cnpj if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj_unique 
ON public.profiles(cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';

-- Create unique index on phone if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique 
ON public.profiles(phone) 
WHERE phone IS NOT NULL AND phone != '';

-- COMMENT
COMMENT ON INDEX public.idx_profiles_cpf_cnpj_unique IS 'Enforce unique CPF/CNPJ for profiles';
COMMENT ON INDEX public.idx_profiles_phone_unique IS 'Enforce unique Phone for profiles';
