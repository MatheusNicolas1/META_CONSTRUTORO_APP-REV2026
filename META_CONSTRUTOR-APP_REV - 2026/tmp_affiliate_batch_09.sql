165|$$;

166|
167|-- ============================================================================
168|-- 9. Função: processar referral ao criar conta
169|-- ============================================================================
170|CREATE OR REPLACE FUNCTION public.process_affiliate_referral(
171|    p_affiliate_code text,
172|    p_referred_email text,
173|    p_referred_user_id uuid
174|)
175|RETURNS uuid
176|LANGUAGE plpgsql
177|SECURITY DEFINER
178|SET search_path = ''
179|AS $$
180|DECLARE
181|    v_affiliate_id uuid;

182|    v_affiliate_user_id uuid;

183|    v_referral_id uuid;

184|BEGIN
185|    SELECT id, user_id INTO v_affiliate_id, v_affiliate_user_id
186|    FROM public.affiliate_profiles
187|    WHERE affiliate_code = p_affiliate_code AND status = 'active';