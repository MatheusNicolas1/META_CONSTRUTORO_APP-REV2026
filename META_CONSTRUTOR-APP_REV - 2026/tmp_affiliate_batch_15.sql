273|
274|-- ============================================================================
275|-- 11. Função: cancelar comissão (cancelamento/reembolso)
276|-- ============================================================================
277|CREATE OR REPLACE FUNCTION public.cancel_affiliate_commission(
278|    p_stripe_invoice_id text,
279|    p_reason text DEFAULT 'refunded'
280|)
281|RETURNS void
282|LANGUAGE plpgsql
283|SECURITY DEFINER
284|SET search_path = ''
285|AS $$
286|DECLARE
287|    v_commission_id uuid;

288|    v_affiliate_id uuid;

289|    v_amount numeric;

290|BEGIN
291|    SELECT id, affiliate_id, amount INTO v_commission_id, v_affiliate_id, v_amount
292|    FROM public.affiliate_commissions
293|    WHERE stripe_invoice_id = p_stripe_invoice_id
294|      AND status IN ('pending', 'approved');

295|
296|    IF v_commission_id IS NULL THEN
297|        RETURN;