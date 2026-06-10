107|    RETURN code;

108|END;

109|$$;

110|
111|-- ============================================================================
112|-- 6. Trigger: criar perfil de afiliado automaticamente ao criar usuário
113|-- ============================================================================
114|CREATE OR REPLACE FUNCTION public.handle_new_affiliate_profile()
115|RETURNS TRIGGER
116|LANGUAGE plpgsql
117|SECURITY DEFINER
118|SET search_path = ''
119|AS $$
120|BEGIN
121|    INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
122|    VALUES (NEW.id, public.generate_affiliate_code());

123|    RETURN NEW;