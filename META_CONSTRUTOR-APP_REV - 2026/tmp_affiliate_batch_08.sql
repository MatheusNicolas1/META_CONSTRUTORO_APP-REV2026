139|BEGIN
140|    FOR user_record IN
141|        SELECT u.id
142|        FROM auth.users u
143|        LEFT JOIN public.affiliate_profiles ap ON ap.user_id = u.id
144|        WHERE ap.id IS NULL
145|    LOOP
146|        INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
147|        VALUES (user_record.id, public.generate_affiliate_code());

148|    END LOOP;

149|END $$;

150|
151|-- ============================================================================
152|-- 8. Função: incrementar contador de cliques do afiliado
153|-- ============================================================================
154|CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(p_affiliate_id uuid)
155|RETURNS void
156|LANGUAGE plpgsql
157|SECURITY DEFINER
158|SET search_path = ''
159|AS $$
160|BEGIN
161|    UPDATE public.affiliate_profiles
162|    SET total_clicks = total_clicks + 1
163|    WHERE id = p_affiliate_id;

164|END;