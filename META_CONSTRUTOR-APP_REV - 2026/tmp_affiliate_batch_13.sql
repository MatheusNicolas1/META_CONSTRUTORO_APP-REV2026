239|BEGIN
240|    SELECT affiliate_id INTO v_affiliate_id
241|    FROM public.affiliate_referrals
242|    WHERE id = p_referral_id;

243|
244|    IF v_affiliate_id IS NULL THEN
245|        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'AF010';

246|    END IF;

247|
248|    v_amount := ROUND(p_net_amount * v_percentage / 100, 2);

249|
250|    UPDATE public.affiliate_referrals
251|    SET status = 'converted',
252|        converted_at = now(),
253|        subscription_id = p_subscription_id
254|    WHERE id = p_referral_id AND status = 'pending';