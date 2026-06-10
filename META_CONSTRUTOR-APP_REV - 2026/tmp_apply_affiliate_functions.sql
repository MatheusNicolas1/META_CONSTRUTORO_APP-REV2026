CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    code text;
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
BEGIN
    LOOP
        code := 'MC';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_profiles WHERE affiliate_code = code);
    END LOOP;
    RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_affiliate_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.affiliate_profiles (user_id, affiliate_code)
    VALUES (NEW.id, public.generate_affiliate_code());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;
CREATE TRIGGER on_auth_user_created_affiliate
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_affiliate_profile();

CREATE TRIGGER update_affiliate_profiles_updated_at
    BEFORE UPDATE ON public.affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.affiliate_profiles
    SET total_clicks = total_clicks + 1
    WHERE id = p_affiliate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_anti_self_referral(
    p_affiliate_user_id uuid,
    p_referred_email text,
    p_referred_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_email_owner uuid;
BEGIN
    -- Check if the referred email belongs to the affiliate user
    SELECT id INTO v_email_owner
    FROM auth.users
    WHERE id = p_referred_user_id AND id = p_affiliate_user_id;
    
    IF FOUND THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_affiliate_referral(
    p_affiliate_code text,
    p_referred_email text,
    p_referred_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id uuid;
    v_affiliate_user_id uuid;
    v_referral_id uuid;
BEGIN
    SELECT id, user_id INTO v_affiliate_id, v_affiliate_user_id
    FROM public.affiliate_profiles
    WHERE affiliate_code = p_affiliate_code AND status = 'active';

    IF v_affiliate_id IS NULL THEN
        RAISE EXCEPTION 'Affiliate code not found or inactive' USING ERRCODE = 'AF001';
    END IF;

    IF NOT public.check_anti_self_referral(
        v_affiliate_user_id,
        p_referred_email,
        p_referred_user_id
    ) THEN
        RAISE EXCEPTION 'Self-referral not allowed' USING ERRCODE = 'AF002';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.affiliate_referrals
        WHERE referred_email = p_referred_email
          AND status IN ('pending', 'converted')
    ) THEN
        RAISE EXCEPTION 'Email already referred' USING ERRCODE = 'AF003';
    END IF;

    INSERT INTO public.affiliate_referrals (
        affiliate_id,
        referred_user_id,
        referred_email,
        status
    ) VALUES (
        v_affiliate_id,
        p_referred_user_id,
        p_referred_email,
        'pending'
    ) RETURNING id INTO v_referral_id;

    UPDATE public.affiliate_profiles
    SET total_referrals = total_referrals + 1
    WHERE id = v_affiliate_id;

    RETURN v_referral_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_commission(
    p_referral_id uuid,
    p_subscription_id text,
    p_stripe_invoice_id text,
    p_gross_amount numeric,
    p_net_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_affiliate_id uuid;
    v_commission_id uuid;
    v_percentage integer := 40;
    v_amount numeric;
BEGIN
    SELECT affiliate_id INTO v_affiliate_id
    FROM public.affiliate_referrals
    WHERE id = p_referral_id;

    IF v_affiliate_id IS NULL THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'AF010';
    END IF;

    v_amount := ROUND(p_net_amount * v_percentage / 100, 2);

    UPDATE public.affiliate_referrals
    SET status = 'converted',
        converted_at = now(),
        subscription_id = p_subscription_id
    WHERE id = p_referral_id AND status = 'pending';

    INSERT INTO public.affiliate_commissions (
        affiliate_id,
        referral_id,
        subscription_id,
        stripe_invoice_id,
        gross_amount,
        net_amount,
        amount,
        percentage,
        status
    ) VALUES (
        v_affiliate_id,
        p_referral_id,
        p_subscription_id,
        p_stripe_invoice_id,
        p_gross_amount,
        p_net_amount,
        v_amount,
        v_percentage,
        'pending'
    ) RETURNING id INTO v_commission_id;

    UPDATE public.affiliate_profiles
    SET total_commissions = total_commissions + v_amount
    WHERE id = v_affiliate_id;

    RETURN v_commission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_affiliate_commission(
    p_stripe_invoice_id text,
    p_reason text DEFAULT 'refunded'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_commission_id uuid;
    v_affiliate_id uuid;
    v_amount numeric;
BEGIN
    SELECT id, affiliate_id, amount INTO v_commission_id, v_affiliate_id, v_amount
    FROM public.affiliate_commissions
    WHERE stripe_invoice_id = p_stripe_invoice_id
      AND status IN ('pending', 'approved');

    IF v_commission_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.affiliate_commissions
    SET status = CASE
            WHEN p_reason = 'refunded' THEN 'refunded'
            ELSE 'cancelled'
        END,
        cancelled_at = now()
    WHERE id = v_commission_id;

    UPDATE public.affiliate_referrals
    SET status = CASE
            WHEN p_reason = 'refunded' THEN 'refunded'
            ELSE 'cancelled'
        END,
        cancelled_at = now()
    WHERE id = (
        SELECT referral_id FROM public.affiliate_commissions WHERE id = v_commission_id
    );

    UPDATE public.affiliate_profiles
    SET total_commissions = GREATEST(0, total_commissions - v_amount)
    WHERE id = v_affiliate_id;
END;
$$;
