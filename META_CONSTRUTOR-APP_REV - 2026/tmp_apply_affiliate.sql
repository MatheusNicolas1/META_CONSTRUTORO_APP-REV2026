CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
    total_clicks integer NOT NULL DEFAULT 0,
    total_referrals integer NOT NULL DEFAULT 0,
    total_commissions numeric(12,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT affiliate_code_format CHECK (affiliate_code ~ '^MC[A-Z0-9]{8}$'),
    CONSTRAINT affiliate_profiles_user_id_unique UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON public.affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON public.affiliate_profiles(status);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    visitor_ip text NOT NULL,
    visitor_agent text DEFAULT '',
    referrer_url text DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_visitor_ip ON public.affiliate_clicks(visitor_ip);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    referred_email text NOT NULL,
    subscription_id text DEFAULT '',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled', 'refunded')),
    created_at timestamptz NOT NULL DEFAULT now(),
    converted_at timestamptz,
    cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user ON public.affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_email ON public.affiliate_referrals(referred_email);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
    subscription_id text NOT NULL,
    stripe_invoice_id text DEFAULT '',
    gross_amount numeric(12,2) NOT NULL,
    net_amount numeric(12,2) NOT NULL,
    amount numeric(12,2) NOT NULL,
    percentage integer NOT NULL DEFAULT 40 CHECK (percentage = 40),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'refunded')),
    created_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    paid_at timestamptz,
    cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON public.affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_subscription ON public.affiliate_commissions(subscription_id);
