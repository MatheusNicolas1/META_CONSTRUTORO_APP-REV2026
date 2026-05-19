
-- ============================================================
-- MIGRATION: security_hardening_storage_policies_and_constraints
-- Data: 2026-02-25
-- Correções pós-pentest interno:
--   1) Storage avatars: owner-check obrigatório
--   2) profiles.terms_accepted_at: CHECK constraint
--   3) user_credits: remover policies SELECT/UPDATE duplicadas
-- ============================================================

-- ============================================================
-- BLOCO 1: STORAGE — AVATARS OWNER-CHECK
-- ============================================================

-- 1a) Remover policy genérica "Allow authenticated uploads"
-- (permitia upload em avatars/ SEM verificar owner)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 1b) Remover policy "Public Access" que unifica avatars + community_media
-- (será recriada separada e mais granular)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 1c) Nova policy INSERT para avatars: SOMENTE na própria pasta {uid}/*
CREATE POLICY "Avatars: upload somente pasta própria"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 1d) Nova policy INSERT para community_media (manter comportamento existente,
-- mas recriar separado para não depender da policy genérica removida)
-- Já existe "Usuários podem fazer upload de mídia" com owner-check — não duplicar.
-- Verificação: se não existir, criar:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Usuários podem fazer upload de mídia'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Usuários podem fazer upload de mídia"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'community_media'
        AND (auth.uid())::text = (storage.foldername(name))[1]
      )
    $p$;
  END IF;
END;
$$;

-- 1e) Nova policy SELECT para avatars: apenas o próprio user lê seu avatar
-- (avatares não são públicos por padrão — se quiser público, deve ser explícito)
CREATE POLICY "Avatars: leitura apenas do próprio usuário"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 1f) Manter community_media como pública (por design — feed social)
-- Policy "Mídia é pública para visualização" já existe — não recriar.
-- Verificação defensiva:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mídia é pública para visualização'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Mídia é pública para visualização"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'community_media')
    $p$;
  END IF;
END;
$$;

-- 1g) Policy UPDATE para avatars: somente o próprio user atualiza
CREATE POLICY "Avatars: atualização somente pasta própria"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 1h) Policy DELETE para avatars: somente o próprio user deleta
CREATE POLICY "Avatars: exclusão somente pasta própria"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============================================================
-- BLOCO 2: profiles — CHECK CONSTRAINT em terms_accepted_at
-- ============================================================

-- Adicionar constraint robusta: NOT NULL (já existe) + não pode ser futuro
-- Protege contra INSERT mesmo que a trigger seja removida
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_terms_accepted_at_not_future
  CHECK (terms_accepted_at <= (now() + interval '5 minutes'));

-- ============================================================
-- BLOCO 3: user_credits — REMOVER POLICIES DUPLICADAS
-- ============================================================

-- SELECT duplicadas: manter apenas "Users can view own credits"
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users read own credits" ON public.user_credits;

-- UPDATE duplicadas: manter apenas "Users can update own credits"
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- Resultado esperado em user_credits:
-- ALL   → "Admins manage credits"
-- SELECT → "Users can view own credits"
-- UPDATE → "Users can update own credits"
;
