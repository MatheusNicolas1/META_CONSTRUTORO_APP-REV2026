
-- Criar bucket 'documentos' (privado — upload de RDO, notas fiscais)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket 'avatars' (privado por padrão — policies já criadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policies para bucket 'documentos'
-- INSERT: usuário autenticado sobe na pasta {rdo_id}/
CREATE POLICY "Documentos: upload autenticado"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

-- SELECT: usuário vê seus próprios documentos OU admin/gerente
CREATE POLICY "Documentos: leitura autenticada"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

-- UPDATE
CREATE POLICY "Documentos: atualização autenticada"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

-- DELETE
CREATE POLICY "Documentos: exclusão autenticada"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentos');
;
