203|    END IF;

204|
205|    INSERT INTO public.affiliate_referrals (
206|        affiliate_id, referred_user_id, referred_email, status
207|    ) VALUES (
208|        v_affiliate_id, p_referred_user_id, p_referred_email, 'pending'
209|    ) RETURNING id INTO v_referral_id;

210|
211|    UPDATE public.affiliate_profiles
212|    SET total_referrals = total_referrals + 1
213|    WHERE id = v_affiliate_id;

214|
215|    RETURN v_referral_id;

216|END;