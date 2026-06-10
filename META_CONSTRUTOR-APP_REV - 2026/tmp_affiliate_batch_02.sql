39|
40|CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);

41|CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);

42|CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_visitor_ip ON public.affiliate_clicks(visitor_ip);

43|
44|-- ============================================================================
45|-- 3. affiliate_referrals — Indicações (vínculo entre afiliado e indicado)
46|-- ============================================================================
47|CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
48|    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
49|    affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
50|    referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
51|    referred_email text NOT NULL,
52|    subscription_id text DEFAULT '',
53|    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled', 'refunded')),
54|    created_at timestamptz NOT NULL DEFAULT now(),
55|    converted_at timestamptz,
56|    cancelled_at timestamptz
57|);

58|
59|CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);