drop policy if exists "Lixeira: hide deleted rows" on public.atividades;

drop policy if exists "Atividades: View" on public.atividades;
create policy "Atividades: View"
on public.atividades
for select
to authenticated
using (
  public.is_org_member(org_id)
  and deleted_at is null
);

drop policy if exists "Atividades: Update" on public.atividades;
create policy "Atividades: Update"
on public.atividades
for update
to authenticated
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create or replace function public.soft_delete_atividade(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_org_id uuid;
begin
  select org_id
  into activity_org_id
  from public.atividades
  where id = p_activity_id
    and deleted_at is null;

  if activity_org_id is null then
    raise exception 'Atividade nao encontrada.';
  end if;

  if not public.is_org_member(activity_org_id) then
    raise exception 'Usuario sem permissao para esta organizacao.';
  end if;

  update public.atividades
  set deleted_at = now(),
      deleted_by = auth.uid(),
      delete_origin = 'atividades'
  where id = p_activity_id
    and deleted_at is null;
end;
$$;

revoke all on function public.soft_delete_atividade(uuid) from public;
grant execute on function public.soft_delete_atividade(uuid) to authenticated;
