ALTER TABLE public.obras RENAME COLUMN user_id TO created_by;
ALTER TABLE public.rdos RENAME COLUMN user_id TO created_by;
ALTER TABLE public.equipes RENAME COLUMN user_id TO created_by;
ALTER TABLE public.fornecedores RENAME COLUMN user_id TO created_by;
ALTER TABLE public.equipamentos RENAME COLUMN user_id TO created_by;
