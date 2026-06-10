60|CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user ON public.affiliate_referrals(referred_user_id);

61|CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(status);

62|CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_email ON public.affiliate_referrals(referred_email);

63|
64|-- ============================================================================
65|-- 4. affiliate_commissions — Comissões geradas por pagamentos
66|-- ============================================================================
67|CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
68|    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
69|    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
70|    referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
71|    subscription_id text NOT NULL,
72|    stripe_invoice_id text DEFAULT '',
73|    gross_amount numeric(12,2) NOT NULL,
74|    net_amount numeric(12,2) NOT NULL,
75|    amount numeric(12,2) NOT NULL,
76|    percentage integer NOT NULL DEFAULT 40 CHECK (percentage = 40),
77|    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'refunded')),
78|    created_at timestamptz NOT NULL DEFAULT now(),
79|    approved_at timestamptz,
80|    paid_at timestamptz,
81|    cancelled_at timestamptz
82|);

83|
84|CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);