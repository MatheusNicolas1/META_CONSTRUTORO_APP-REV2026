85|CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON public.affiliate_commissions(referral_id);

86|CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

87|CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_subscription ON public.affiliate_commissions(subscription_id);

88|
89|-- ============================================================================
90|-- 5. Função para gerar código de afiliado no formato MCXXXXXXXX
91|-- ============================================================================
92|CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
93|RETURNS text
94|LANGUAGE plpgsql
95|AS $$
96|DECLARE
97|    code text;

98|    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';