-- PRD_AUDIO_ELEVENLABS: foundation tables for audio summaries with ElevenLabs.
-- Additive/idempotent migration.

-- 1. Audio Summary Topics
create table if not exists public.audio_summary_topics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  source_type text not null check (source_type in ('obras','rdos','atividades','checklists','despesas','documentos','alertas','resumo_diario','resumo_semanal')),
  source_filters jsonb default '{}'::jsonb,
  prompt_template text default '',
  schedule_config jsonb default '{}'::jsonb,
  audience_config jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_audio_summary_topics_org on public.audio_summary_topics(org_id);
create index if not exists idx_audio_summary_topics_active on public.audio_summary_topics(org_id, is_active);

-- 2. Audio Voice Profiles
create table if not exists public.audio_voice_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  label text not null check (label in ('Masculina','Feminina','Personalizada')),
  provider text not null default 'elevenlabs' check (provider in ('elevenlabs','openai')),
  provider_voice_id text not null,
  voice_instructions text default '',
  response_format text default 'mp3_44100_192',
  speed numeric default 1.0 check (speed between 0.5 and 2.0),
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_audio_voice_profiles_org_label unique (org_id, label)
);

create index if not exists idx_audio_voice_profiles_org on public.audio_voice_profiles(org_id);

-- 3. Audio Delivery Subscriptions
create table if not exists public.audio_delivery_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text,
  recipient_phone text not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','telegram','sms')),
  topic_id uuid not null references public.audio_summary_topics(id) on delete cascade,
  voice_profile_id uuid references public.audio_voice_profiles(id) on delete set null,
  opt_in_status text not null default 'pending' check (opt_in_status in ('pending','confirmed','revoked')),
  opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_audio_delivery_subs_org on public.audio_delivery_subscriptions(org_id);
create index if not exists idx_audio_delivery_subs_topic on public.audio_delivery_subscriptions(topic_id);

-- 4. Audio Summary Jobs (idempotent execution tracking)
create table if not exists public.audio_summary_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  topic_id uuid references public.audio_summary_topics(id) on delete set null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_phone text,
  voice_profile_id uuid references public.audio_voice_profiles(id) on delete set null,
  idempotency_key text not null,
  status text not null default 'pending' check (status in ('pending','generating','generated','uploaded','sent','delivered','played','failed')),
  summary_text text,
  audio_storage_path text,
  provider_media_id text,
  provider_message_id text,
  attempts int not null default 0,
  last_error text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  tts_chars_consumed int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_audio_jobs_idempotency unique (org_id, idempotency_key)
);

create index if not exists idx_audio_jobs_org_status on public.audio_summary_jobs(org_id, status);
create index if not exists idx_audio_jobs_scheduled on public.audio_summary_jobs(scheduled_for) where status = 'pending';
create index if not exists idx_audio_jobs_idempotency on public.audio_summary_jobs(org_id, idempotency_key);

-- 5. Audio Inbound Messages
create table if not exists public.audio_inbound_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  contact_phone text not null,
  provider_message_id text,
  provider_media_id text,
  audio_storage_path text,
  transcription_text text,
  intent text,
  status text not null default 'received' check (status in ('received','transcribing','transcribed','responded','failed')),
  stt_model_used text,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audio_inbound_org on public.audio_inbound_messages(org_id);
create index if not exists idx_audio_inbound_contact on public.audio_inbound_messages(contact_phone);

-- 6. Audio Costs
create table if not exists public.audio_costs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  date date not null default current_date,
  provider text not null default 'elevenlabs' check (provider in ('elevenlabs','openai','whisper')),
  operation text not null check (operation in ('tts','stt')),
  chars_consumed int not null default 0,
  estimated_cost numeric(10,6) default 0,
  job_id uuid references public.audio_summary_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audio_costs_org_date on public.audio_costs(org_id, date);

-- 7. Row Level Security
alter table public.audio_summary_topics enable row level security;
alter table public.audio_voice_profiles enable row level security;
alter table public.audio_delivery_subscriptions enable row level security;
alter table public.audio_summary_jobs enable row level security;
alter table public.audio_inbound_messages enable row level security;
alter table public.audio_costs enable row level security;

-- Org-scoped read
create policy "Audio: read own org"
  on public.audio_summary_topics for select
  using (org_id = coalesce((select org_id from public.org_members where user_id = auth.uid() limit 1), '00000000-0000-0000-0000-000000000000'));

create policy "Audio: read own org"
  on public.audio_voice_profiles for select
  using (org_id = coalesce((select org_id from public.org_members where user_id = auth.uid() limit 1), '00000000-0000-0000-0000-000000000000'));

create policy "Audio: read own org"
  on public.audio_delivery_subscriptions for select
  using (org_id = coalesce((select org_id from public.org_members where user_id = auth.uid() limit 1), '00000000-0000-0000-0000-000000000000'));

create policy "Audio: read own org"
  on public.audio_summary_jobs for select
  using (org_id = coalesce((select org_id from public.org_members where user_id = auth.uid() limit 1), '00000000-0000-0000-0000-000000000000'));

create policy "Audio: read own org"
  on public.audio_costs for select
  using (org_id = coalesce((select org_id from public.org_members where user_id = auth.uid() limit 1), '00000000-0000-0000-0000-000000000000'));

-- Admin/manager write: check membership role directly in org_members
create policy "Audio: admin write topics"
  on public.audio_summary_topics for insert
  with check (
    exists (select 1 from public.org_members
      where user_id = auth.uid() and org_id = audio_summary_topics.org_id
      and role in ('Presidente','Administrador','Gerente'))
  );

create policy "Audio: admin write profiles"
  on public.audio_voice_profiles for insert
  with check (
    exists (select 1 from public.org_members
      where user_id = auth.uid() and org_id = audio_voice_profiles.org_id
      and role in ('Presidente','Administrador','Gerente'))
  );

create policy "Audio: admin write subscriptions"
  on public.audio_delivery_subscriptions for insert
  with check (
    exists (select 1 from public.org_members
      where user_id = auth.uid() and org_id = audio_delivery_subscriptions.org_id
      and role in ('Presidente','Administrador','Gerente'))
  );

create policy "Audio: admin write jobs"
  on public.audio_summary_jobs for insert
  with check (
    exists (select 1 from public.org_members
      where user_id = auth.uid() and org_id = audio_summary_jobs.org_id
      and role in ('Presidente','Administrador','Gerente'))
  );

-- Update policies for same roles
create policy "Audio: admin update topics"
  on public.audio_summary_topics for update
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_summary_topics.org_id
    and role in ('Presidente','Administrador','Gerente')));

create policy "Audio: admin update profiles"
  on public.audio_voice_profiles for update
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_voice_profiles.org_id
    and role in ('Presidente','Administrador','Gerente')));

create policy "Audio: admin update subscriptions"
  on public.audio_delivery_subscriptions for update
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_delivery_subscriptions.org_id
    and role in ('Presidente','Administrador','Gerente')));

create policy "Audio: admin update jobs"
  on public.audio_summary_jobs for update
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_summary_jobs.org_id
    and role in ('Presidente','Administrador','Gerente')));

-- Delete policies
create policy "Audio: admin delete topics"
  on public.audio_summary_topics for delete
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_summary_topics.org_id
    and role in ('Presidente','Administrador','Gerente')));

create policy "Audio: admin delete profiles"
  on public.audio_voice_profiles for delete
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_voice_profiles.org_id
    and role in ('Presidente','Administrador','Gerente')));

create policy "Audio: admin delete subscriptions"
  on public.audio_delivery_subscriptions for delete
  using (exists (select 1 from public.org_members
    where user_id = auth.uid() and org_id = audio_delivery_subscriptions.org_id
    and role in ('Presidente','Administrador','Gerente')));

-- 8. Storage bucket for audio files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio-files', 'audio-files', false, 10485760, '{audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/webm}')
on conflict (id) do nothing;

-- Storage RLS: org-scoped access
create policy "Audio: org members read"
  on storage.objects for select
  using (
    bucket_id = 'audio-files'
    and exists (
      select 1 from public.org_members
      where user_id = auth.uid()
      and storage.objects.name like (org_members.org_id::text || '/%')
    )
  );

create policy "Audio: service role write"
  on storage.objects for insert
  with check (
    bucket_id = 'audio-files'
    and (auth.role() = 'service_role' or auth.role() = 'authenticated')
  );

create policy "Audio: service role delete"
  on storage.objects for delete
  using (
    bucket_id = 'audio-files'
    and auth.role() = 'service_role'
  );

-- 9. Updated_at triggers
create or replace function app_private.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_audio_topics_updated_at') then
    create trigger trg_audio_topics_updated_at before update on public.audio_summary_topics
      for each row execute function app_private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_audio_profiles_updated_at') then
    create trigger trg_audio_profiles_updated_at before update on public.audio_voice_profiles
      for each row execute function app_private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_audio_subs_updated_at') then
    create trigger trg_audio_subs_updated_at before update on public.audio_delivery_subscriptions
      for each row execute function app_private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_audio_jobs_updated_at') then
    create trigger trg_audio_jobs_updated_at before update on public.audio_summary_jobs
      for each row execute function app_private.set_updated_at();
  end if;
end;
$$;
