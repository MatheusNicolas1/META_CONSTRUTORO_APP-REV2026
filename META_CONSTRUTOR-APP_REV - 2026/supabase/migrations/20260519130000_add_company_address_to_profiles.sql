alter table public.profiles
  add column if not exists company_address text;

comment on column public.profiles.company_address is 'Endereco da empresa informado nas configuracoes do usuario';
