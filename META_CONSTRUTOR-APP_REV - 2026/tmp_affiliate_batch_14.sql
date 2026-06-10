255|
256|    INSERT INTO public.affiliate_commissions (
257|        affiliate_id, referral_id, subscription_id,
258|        stripe_invoice_id, gross_amount, net_amount,
259|        amount, percentage, status
260|    ) VALUES (
261|        v_affiliate_id, p_referral_id, p_subscription_id,
262|        p_stripe_invoice_id, p_gross_amount, p_net_amount,
263|        v_amount, v_percentage, 'pending'
264|    ) RETURNING id INTO v_commission_id;

265|
266|    UPDATE public.affiliate_profiles
267|    SET total_commissions = total_commissions + v_amount
268|    WHERE id = v_affiliate_id;

269|
270|    RETURN v_commission_id;

271|END;

272|$$;