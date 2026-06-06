-- PRD_LIXEIRA: soft delete foundation for the first operational modules.
-- Additive/idempotent migration for the initial modules covered by the Lixeira.

create schema if not exists app_private;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'lixeira_items'
      and c.relkind = 'v'
  ) then
    drop view public.lixeira_items;
  end if;
end;
$$;

create table if not exists public.lixeira_items (
  entity_type text not null,
  entity_id uuid not null,
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text,
  subtitle text,
  deleted_at timestamptz not null,
  deleted_by uuid references auth.users(id) on delete set null,
  purge_at timestamptz,
  source_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create index if not exists idx_lixeira_items_org_deleted_at
  on public.lixeira_items (org_id, deleted_at desc);

create index if not exists idx_lixeira_items_org_purge_at
  on public.lixeira_items (org_id, purge_at)
  where purge_at is not null;

alter table public.lixeira_items enable row level security;

drop policy if exists "Lixeira: org members can view" on public.lixeira_items;
create policy "Lixeira: org members can view"
  on public.lixeira_items
  for select
  to authenticated
  using (public.is_org_member(org_id));

grant select on public.lixeira_items to authenticated;

create or replace function app_private.apply_lixeira_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_by := coalesce(new.deleted_by, auth.uid());
    new.purge_at := coalesce(new.purge_at, new.deleted_at + interval '30 days');
    new.delete_origin := coalesce(new.delete_origin, tg_table_name);
  end if;

  if old.deleted_at is not null and new.deleted_at is null then
    new.deleted_by := null;
    new.delete_reason := null;
    new.delete_origin := null;
    new.purge_at := null;
  end if;

  return new;
end;
$$;

create or replace function app_private.audit_lixeira_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  audit_action text;
begin
  if old.deleted_at is null and new.deleted_at is not null then
    actor_id := coalesce(new.deleted_by, auth.uid());
    audit_action := 'lixeira.soft_deleted';
  elsif old.deleted_at is not null and new.deleted_at is null then
    actor_id := auth.uid();
    audit_action := 'lixeira.restored';
  else
    return new;
  end if;

  insert into public.audit_logs (user_id, action, entity, entity_id, details)
  values (
    actor_id,
    audit_action,
    tg_table_name,
    old.id::text,
    jsonb_build_object(
      'org_id', coalesce(new.org_id, old.org_id),
      'deleted_at', new.deleted_at,
      'purge_at', new.purge_at,
      'delete_origin', new.delete_origin,
      'delete_reason', new.delete_reason
    )
  );

  return new;
end;
$$;

create or replace function app_private.sync_lixeira_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_title text;
  item_subtitle text;
  item_source_path text;
  item_metadata jsonb;
  item_org_id uuid;
begin
  if old.deleted_at is null and new.deleted_at is null then
    return new;
  end if;

  if new.deleted_at is null then
    delete from public.lixeira_items
    where entity_type = tg_table_name
      and entity_id = new.id;

    return new;
  end if;

  item_org_id := new.org_id;

  if tg_table_name = 'obras' then
    item_title := new.nome;
    item_subtitle := new.cliente;
    item_source_path := '/app/obras/' || new.id::text;
    item_metadata := jsonb_build_object(
      'status', new.status,
      'cliente', new.cliente,
      'localizacao', new.localizacao
    );
  elsif tg_table_name = 'documentos' then
    item_org_id := coalesce(
      new.org_id,
      (select obras.org_id from public.obras where obras.id = new.obra_id),
      (select rdos.org_id from public.rdos where rdos.id = new.rdo_id),
      (select checklists.org_id from public.checklists where checklists.id = new.checklist_id)
    );
    item_title := new.nome;
    item_subtitle := coalesce(new.categoria, new.tipo);
    item_source_path := '/app/documentos';
    item_metadata := jsonb_build_object(
      'url', new.url,
      'tipo', new.tipo,
      'categoria', new.categoria,
      'obra_id', new.obra_id,
      'rdo_id', new.rdo_id,
      'checklist_id', new.checklist_id,
      'checklist_item_id', new.checklist_item_id
    );
  elsif tg_table_name = 'rdos' then
    item_title := 'RDO ' || coalesce(new.numero::text, new.id::text);
    item_subtitle := new.data::text;
    item_source_path := '/app/rdo/' || new.id::text || '/visualizar';
    item_metadata := jsonb_build_object(
      'status', new.status,
      'obra_id', new.obra_id,
      'data', new.data
    );
  elsif tg_table_name = 'checklists' then
    item_title := new.titulo;
    item_subtitle := new.categoria;
    item_source_path := '/app/checklist/' || new.id::text;
    item_metadata := jsonb_build_object(
      'status', new.status,
      'obra_id', new.obra_id,
      'data_vencimento', new.data_vencimento
    );
  elsif tg_table_name = 'atividades' then
    item_title := new.titulo;
    item_subtitle := coalesce(new.data::text, new.categoria);
    item_source_path := '/app/atividades';
    item_metadata := jsonb_build_object(
      'status', new.status,
      'obra_id', new.obra_id,
      'prioridade', new.prioridade
    );
  elsif tg_table_name = 'expenses' then
    item_title := coalesce(new.supplier_name, new.invoice_number, new.cost_category, 'Despesa');
    item_subtitle := new.amount::text;
    item_source_path := '/app/despesas';
    item_metadata := jsonb_build_object(
      'approval_status', new.approval_status,
      'obra_id', new.obra_id,
      'cost_category', new.cost_category,
      'invoice_file_url', new.invoice_file_url
    );
  else
    return new;
  end if;

  if item_org_id is null then
    raise exception 'Item sem org_id nao pode ser enviado para a Lixeira.';
  end if;

  insert into public.lixeira_items (
    entity_type,
    entity_id,
    org_id,
    title,
    subtitle,
    deleted_at,
    deleted_by,
    purge_at,
    source_path,
    metadata,
    updated_at
  )
  values (
    tg_table_name,
    new.id,
    item_org_id,
    item_title,
    item_subtitle,
    new.deleted_at,
    new.deleted_by,
    new.purge_at,
    item_source_path,
    item_metadata,
    now()
  )
  on conflict (entity_type, entity_id) do update set
    org_id = excluded.org_id,
    title = excluded.title,
    subtitle = excluded.subtitle,
    deleted_at = excluded.deleted_at,
    deleted_by = excluded.deleted_by,
    purge_at = excluded.purge_at,
    source_path = excluded.source_path,
    metadata = excluded.metadata,
    updated_at = now();

  return new;
end;
$$;

create or replace function app_private.assert_lixeira_entity(p_entity_type text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_entity_type <> all(array[
    'obras',
    'documentos',
    'rdos',
    'checklists',
    'atividades',
    'expenses'
  ]) then
    raise exception 'Tipo de item invalido para a Lixeira.';
  end if;

  return p_entity_type;
end;
$$;

create or replace function app_private.restore_lixeira_item(
  p_entity_type text,
  p_entity_id uuid
)
returns public.lixeira_items
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  target_table text;
  item public.lixeira_items;
begin
  target_table := app_private.assert_lixeira_entity(p_entity_type);

  select *
  into item
  from public.lixeira_items
  where entity_type = target_table
    and entity_id = p_entity_id;

  if not found then
    raise exception 'Item nao encontrado na Lixeira.';
  end if;

  if item.purge_at is not null and item.purge_at <= now() then
    raise exception 'Prazo de restauracao encerrado.';
  end if;

  if not public.is_org_member(item.org_id) then
    raise exception 'Usuario sem permissao para esta organizacao.';
  end if;

  if not (
    item.deleted_by = auth.uid()
    or public.has_org_role(
      item.org_id,
      array['Administrador', 'Gerente', 'Presidente']::public.app_role[]
    )
  ) then
    raise exception 'Usuario sem permissao para restaurar este item.';
  end if;

  execute format(
    'update public.%I
       set deleted_at = null,
           deleted_by = null,
           delete_reason = null,
           delete_origin = null,
           purge_at = null
     where id = $1',
    target_table
  )
  using p_entity_id;

  return item;
end;
$$;

create or replace function app_private.delete_lixeira_item_permanently(
  p_entity_type text,
  p_entity_id uuid
)
returns public.lixeira_items
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  target_table text;
  item public.lixeira_items;
begin
  target_table := app_private.assert_lixeira_entity(p_entity_type);

  select *
  into item
  from public.lixeira_items
  where entity_type = target_table
    and entity_id = p_entity_id;

  if not found then
    raise exception 'Item nao encontrado na Lixeira.';
  end if;

  if not public.has_org_role(
    item.org_id,
    array['Administrador', 'Presidente']::public.app_role[]
  ) then
    raise exception 'Usuario sem permissao para excluir definitivamente.';
  end if;

  execute format('delete from public.%I where id = $1', target_table)
  using p_entity_id;

  delete from public.lixeira_items
  where entity_type = target_table
    and entity_id = p_entity_id;

  insert into public.audit_logs (user_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'lixeira.permanently_deleted',
    target_table,
    p_entity_id::text,
    jsonb_build_object(
      'org_id', item.org_id,
      'deleted_at', item.deleted_at,
      'purge_at', item.purge_at,
      'source_path', item.source_path
    )
  );

  return item;
end;
$$;

create or replace function app_private.purge_expired_lixeira_items()
returns integer
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  item public.lixeira_items;
  purged_count integer := 0;
begin
  for item in
    select *
    from public.lixeira_items
    where purge_at is not null
      and purge_at <= now()
    order by purge_at
  loop
    perform app_private.assert_lixeira_entity(item.entity_type);

    execute format('delete from public.%I where id = $1', item.entity_type)
    using item.entity_id;

    delete from public.lixeira_items
    where entity_type = item.entity_type
      and entity_id = item.entity_id;

    insert into public.audit_logs (user_id, action, entity, entity_id, details)
    values (
      null,
      'lixeira.purged',
      item.entity_type,
      item.entity_id::text,
      jsonb_build_object(
        'org_id', item.org_id,
        'deleted_at', item.deleted_at,
        'purge_at', item.purge_at,
        'origin', 'system'
      )
    );

    purged_count := purged_count + 1;
  end loop;

  return purged_count;
end;
$$;

create or replace function public.restore_lixeira_item(
  p_entity_type text,
  p_entity_id uuid
)
returns public.lixeira_items
language sql
security invoker
set search_path = public, app_private
as $$
  select * from app_private.restore_lixeira_item(p_entity_type, p_entity_id);
$$;

create or replace function public.delete_lixeira_item_permanently(
  p_entity_type text,
  p_entity_id uuid
)
returns public.lixeira_items
language sql
security invoker
set search_path = public, app_private
as $$
  select * from app_private.delete_lixeira_item_permanently(p_entity_type, p_entity_id);
$$;

grant usage on schema app_private to authenticated;
grant execute on function app_private.restore_lixeira_item(text, uuid) to authenticated;
grant execute on function app_private.delete_lixeira_item_permanently(text, uuid) to authenticated;
grant execute on function public.restore_lixeira_item(text, uuid) to authenticated;
grant execute on function public.delete_lixeira_item_permanently(text, uuid) to authenticated;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'obras',
    'documentos',
    'rdos',
    'checklists',
    'atividades',
    'expenses'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is not null then
      execute format('alter table public.%I add column if not exists deleted_at timestamptz', target_table);
      execute format('alter table public.%I add column if not exists deleted_by uuid references auth.users(id) on delete set null', target_table);
      execute format('alter table public.%I add column if not exists delete_reason text', target_table);
      execute format('alter table public.%I add column if not exists delete_origin text', target_table);
      execute format('alter table public.%I add column if not exists purge_at timestamptz', target_table);

      execute format(
        'create index if not exists %I on public.%I (org_id, deleted_at) where deleted_at is null',
        'idx_' || target_table || '_active_org_deleted_at',
        target_table
      );

      execute format(
        'create index if not exists %I on public.%I (org_id, purge_at) where deleted_at is not null',
        'idx_' || target_table || '_trash_org_purge_at',
        target_table
      );

      execute format('drop trigger if exists %I on public.%I', 'trg_' || target_table || '_apply_lixeira_metadata', target_table);
      execute format(
        'create trigger %I before update on public.%I for each row execute function app_private.apply_lixeira_metadata()',
        'trg_' || target_table || '_apply_lixeira_metadata',
        target_table
      );

      execute format('drop trigger if exists %I on public.%I', 'trg_' || target_table || '_audit_lixeira_transition', target_table);
      execute format(
        'create trigger %I after update on public.%I for each row execute function app_private.audit_lixeira_transition()',
        'trg_' || target_table || '_audit_lixeira_transition',
        target_table
      );

      execute format('drop trigger if exists %I on public.%I', 'trg_' || target_table || '_sync_lixeira_item', target_table);
      execute format(
        'create trigger %I after update on public.%I for each row execute function app_private.sync_lixeira_item()',
        'trg_' || target_table || '_sync_lixeira_item',
        target_table
      );

      execute format('drop policy if exists %I on public.%I', 'Lixeira: hide deleted rows', target_table);
      execute format(
        'create policy %I on public.%I as restrictive for select to authenticated using (deleted_at is null)',
        'Lixeira: hide deleted rows',
        target_table
      );
    end if;
  end loop;
end;
$$;
