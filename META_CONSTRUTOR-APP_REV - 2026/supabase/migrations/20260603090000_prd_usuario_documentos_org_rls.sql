-- PRD_USUARIO: consolidate documentos RLS around active organization membership.
-- Keeps the restrictive Lixeira policy intact and removes legacy owner-only/null-org
-- policies that conflict with org-scoped document collaboration.

alter table public.documentos enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'documentos'
      and policyname <> 'Lixeira: hide deleted rows'
  loop
    execute format('drop policy if exists %I on public.documentos', policy_record.policyname);
  end loop;
end;
$$;

drop policy if exists "documentos_org_read" on public.documentos;
create policy "documentos_org_read"
  on public.documentos
  as permissive
  for select
  to authenticated
  using (
    org_id is not null
    and public.is_org_member(org_id)
  );

drop policy if exists "documentos_org_insert" on public.documentos;
create policy "documentos_org_insert"
  on public.documentos
  as permissive
  for insert
  to authenticated
  with check (
    org_id is not null
    and public.is_org_member(org_id)
    and uploaded_by = auth.uid()
  );

drop policy if exists "documentos_org_update" on public.documentos;
create policy "documentos_org_update"
  on public.documentos
  as permissive
  for update
  to authenticated
  using (
    org_id is not null
    and public.is_org_member(org_id)
  )
  with check (
    org_id is not null
    and public.is_org_member(org_id)
  );

drop policy if exists "documentos_org_delete" on public.documentos;
create policy "documentos_org_delete"
  on public.documentos
  as permissive
  for delete
  to authenticated
  using (
    org_id is not null
    and public.is_org_member(org_id)
  );
