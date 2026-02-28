-- ============================================================================
-- SEED DATA FOR LOCAL DEVELOPMENT (FIXED ENUMS & IDEMPOTENCY & SCHEMA)
-- ============================================================================
-- Source of Truth: docs/schema-contract.md
-- ============================================================================

-- Disable triggers to insert into auth.users and bypass some auto-logic
SET session_replication_role = 'replica';

-- 1. Create Dev User (Idempotent)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@local.test',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Dev Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Profile
INSERT INTO public.profiles (
  id,
  name,
  email,
  plan_type,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Dev Admin',
  'admin@local.test',
  'enterprise',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET plan_type = 'enterprise';

-- 3. Create Organization
INSERT INTO public.orgs (
  id,
  name,
  slug,
  owner_user_id,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Dev Corp',
  'dev-corp',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Create Org Member (Admin)
INSERT INTO public.org_members (
  id,
  org_id,
  user_id,
  role,
  status,
  created_at,
  updated_at,
  joined_at
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Administrador'::app_role,
  'active',
  now(),
  now(),
  now()
) ON CONFLICT (org_id, user_id) DO NOTHING;

-- 5. Create Obra
-- Status: 'ACTIVE' (enum obra_status)
INSERT INTO public.obras (
  id,
  nome,
  slug,
  org_id,
  created_by,
  status,
  localizacao,
  responsavel,
  cliente,
  tipo,
  data_inicio,
  previsao_termino,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Obra Exemplo',
  'obra-exemplo',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'ACTIVE'::obra_status,
  'Local de teste - Dev',
  'Dev Admin',
  'Cliente Teste',
  'Residencial',
  now()::date,
  (now() + interval '6 months')::date,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE'::obra_status;

-- 6. Create RDO
-- FIXED: 'criado_por_id' -> 'user_id' (Matches schema in 20260209231000_recreate_rdos.sql)
-- Status: 'DRAFT' (enum rdo_status)
INSERT INTO public.rdos (
  id,
  obra_id,
  org_id,
  data,
  periodo,
  clima,
  status,
  created_by, -- Was user_id
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  now(),
  'Manhã',
  'Ensolarado',
  'DRAFT'::rdo_status,
  '00000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 7. Create Atividade (SKIP: Table does not exist in schema)
-- If 'rdo_atividades' is intended, it needs 'rdo_id', etc. 
-- For now, commenting out to pass seed.

-- 8. Create Expense (SKIP: Table does not exist in schema)

-- Restore triggers
SET session_replication_role = 'origin';

-- Log completion
-- Seed finished

-- 9. Create Storage Bucket (Idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage (Simplistic for dev: allow all)
-- Note: In production, use proper RLS.
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'documentos' );
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'documentos' AND auth.role() = 'authenticated' );
