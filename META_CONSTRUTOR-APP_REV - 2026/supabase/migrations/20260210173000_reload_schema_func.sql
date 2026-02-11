-- Helper function to reload PostgREST schema cache
create or replace function public.reload_schema_cache()
returns void as $$
begin
  notify pgrst, 'reload config';
end;
$$ language plpgsql security definer;
