188|
189|    IF v_affiliate_id IS NULL THEN
190|        RAISE EXCEPTION 'Affiliate code not found or inactive' USING ERRCODE = 'AF001';

191|    END IF;

192|
193|    IF v_affiliate_user_id = p_referred_user_id THEN
194|        RAISE EXCEPTION 'Self-referral not allowed' USING ERRCODE = 'AF002';

195|    END IF;

196|
197|    IF EXISTS (
198|        SELECT 1 FROM public.affiliate_referrals
199|        WHERE referred_email = p_referred_email
200|          AND status IN ('pending', 'converted')
201|    ) THEN
202|        RAISE EXCEPTION 'Email already referred' USING ERRCODE = 'AF003';