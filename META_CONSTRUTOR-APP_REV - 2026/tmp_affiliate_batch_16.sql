298|    END IF;

299|
300|    UPDATE public.affiliate_commissions
301|    SET status = CASE
302|            WHEN p_reason = 'refunded' THEN 'refunded'
303|            ELSE 'cancelled'
304|        END,
305|        cancelled_at = now()
306|    WHERE id = v_commission_id;

307|
308|    UPDATE public.affiliate_referrals
309|    SET status = CASE
310|            WHEN p_reason = 'refunded' THEN 'refunded'
311|            ELSE 'cancelled'
312|        END,
313|        cancelled_at = now()
314|    WHERE id = (SELECT referral_id FROM public.affiliate_commissions WHERE id = v_commission_id);

315|
316|    UPDATE public.affiliate_profiles
317|    SET total_commissions = GREATEST(0, total_commissions - v_amount)
318|    WHERE id = v_affiliate_id;

319|END;