create schema if not exists private;

create table if not exists private.prd5_homolog_allowed_users (
  email text primary key,
  role public.app_role not null
);

insert into private.prd5_homolog_allowed_users (email, role)
values
  ('homolog.prd5.presidente.20260504205708@teste.com', 'Presidente'::public.app_role),
  ('homolog.prd5.administrador.20260504205708@teste.com', 'Administrador'::public.app_role),
  ('homolog.prd5.gerente.20260504205708@teste.com', 'Gerente'::public.app_role),
  ('homolog.prd5.colaborador.20260504205708@teste.com', 'Colaborador'::public.app_role)
on conflict (email) do update
set role = excluded.role;

create or replace function private.sync_prd5_homolog_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = private, public, auth
as $$
declare
  v_shared_org_id constant uuid := 'a7f50485-4351-4ffa-a1a4-3a065ace213e';
  v_email text;
  v_role public.app_role;
begin
  select lower(u.email), a.role
    into v_email, v_role
  from auth.users u
  join private.prd5_homolog_allowed_users a on a.email = lower(u.email)
  where u.id = p_user_id;

  if v_role is null then
    return;
  end if;

  if not exists (select 1 from public.orgs where id = v_shared_org_id) then
    raise log 'PRD5 shared org % not found. Skipping homolog membership sync for %', v_shared_org_id, v_email;
    return;
  end if;

  insert into public.org_members (org_id, user_id, role, status, joined_at)
  values (v_shared_org_id, p_user_id, v_role, 'active'::public.org_member_status, now())
  on conflict (org_id, user_id) do update
  set role = excluded.role,
      status = 'active'::public.org_member_status,
      joined_at = coalesce(public.org_members.joined_at, now()),
      updated_at = now();

  insert into public.user_roles (user_id, role, created_at, updated_at)
  values (p_user_id, v_role, now(), now())
  on conflict (user_id) do update
  set role = excluded.role,
      updated_at = now();

  delete from public.org_members om
  using public.orgs o
  where om.org_id = o.id
    and om.user_id = p_user_id
    and o.owner_user_id = p_user_id
    and om.org_id <> v_shared_org_id;
end;
$$;

create or replace function private.sync_prd5_homolog_user_trigger()
returns trigger
language plpgsql
security definer
set search_path = private, public, auth
as $$
begin
  perform private.sync_prd5_homolog_user(new.id);
  return new;
end;
$$;

drop trigger if exists zz_prd5_homolog_shared_org_sync on auth.users;
create trigger zz_prd5_homolog_shared_org_sync
  after insert or update of email on auth.users
  for each row
  execute function private.sync_prd5_homolog_user_trigger();

do $$
declare
  v_user record;
begin
  for v_user in
    select u.id
    from auth.users u
    join private.prd5_homolog_allowed_users a on a.email = lower(u.email)
  loop
    perform private.sync_prd5_homolog_user(v_user.id);
  end loop;
end $$;

revoke all on function private.sync_prd5_homolog_user(uuid) from public, anon, authenticated;
revoke all on function private.sync_prd5_homolog_user_trigger() from public, anon, authenticated;
