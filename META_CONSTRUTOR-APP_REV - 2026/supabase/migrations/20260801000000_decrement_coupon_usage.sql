-- Migration: Cria a RPC decrement_coupon_usage
-- Data: 2026-08-01
-- Motivo: A EF stripe-webhook (evento checkout.session.expired) precisa
-- reverter o incremento de times_used feito pelo create-checkout-session
-- quando a sessão de checkout expira sem pagamento.
-- Espelha a RPC increment_coupon_usage (20260714000002) em simetria.
-- Toma cuidado para não decrementar abaixo de zero (GREATEST).

CREATE OR REPLACE FUNCTION public.decrement_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET
    times_used = GREATEST(times_used - 1, 0),
    updated_at = now()
  WHERE id = coupon_id;
END;
$$;
