-- Migration: Cria a RPC increment_coupon_usage
-- Data: 2026-07-14
-- Motivo: A EF create-checkout-session chama esta RPC para incrementar
-- times_used na tabela coupons, mas ela não estava nas migrations locais.
-- Pode ter sido criada manualmente no dashboard do Supabase, então
-- usamos OR REPLACE para ser seguro.

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET
    times_used = times_used + 1,
    updated_at = now()
  WHERE id = coupon_id;
END;
$$;
