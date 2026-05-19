ALTER TABLE public.rdo_notas
DROP CONSTRAINT IF EXISTS rdo_notas_user_id_fkey;
ALTER TABLE public.rdo_notas
ADD CONSTRAINT rdo_notas_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;;
