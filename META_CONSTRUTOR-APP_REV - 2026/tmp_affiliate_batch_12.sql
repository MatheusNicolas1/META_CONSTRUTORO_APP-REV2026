217|$$;

218|
219|-- ============================================================================
220|-- 10. Função: gerar comissão a partir de pagamento aprovado
221|-- ============================================================================
222|CREATE OR REPLACE FUNCTION public.generate_affiliate_commission(
223|    p_referral_id uuid,
224|    p_subscription_id text,
225|    p_stripe_invoice_id text,
226|    p_gross_amount numeric,
227|    p_net_amount numeric
228|)
229|RETURNS uuid
230|LANGUAGE plpgsql
231|SECURITY DEFINER
232|SET search_path = ''
233|AS $$
234|DECLARE
235|    v_affiliate_id uuid;

236|    v_commission_id uuid;

237|    v_percentage integer := 40;

238|    v_amount numeric;