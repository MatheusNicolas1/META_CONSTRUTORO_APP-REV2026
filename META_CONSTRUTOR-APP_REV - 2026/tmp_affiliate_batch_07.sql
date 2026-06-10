124|END;

125|$$;

126|
127|DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;

128|CREATE TRIGGER on_auth_user_created_affiliate
129|    AFTER INSERT ON auth.users
130|    FOR EACH ROW
131|    EXECUTE FUNCTION public.handle_new_affiliate_profile();

132|
133|-- ============================================================================
134|-- 7. Backfill para usuários existentes sem perfil de afiliado
135|-- ============================================================================
136|DO $$
137|DECLARE
138|    user_record RECORD;