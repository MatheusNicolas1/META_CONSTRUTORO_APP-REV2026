-- Migration: Update Master Plan Stripe Prices (R$ 347/mês | R$ 3.331/ano)
-- Created at: 2026-06-07
-- Novos preços criados no Stripe para o plano Master:
--   Mensal: price_1TfSRPCHfNdO9jxNA6dpVV7D (R$ 347,00/mês)
--   Anual:  price_1TfSRPCHfNdO9jxNqPNb6MOX (R$ 3.331,00/ano = R$ 277,60/mês × 12)

DO $$
BEGIN
    -- Atualizar apenas o plano Master com os novos preços Stripe
    UPDATE public.plans
    SET 
        stripe_price_id_monthly = 'price_1TfSRPCHfNdO9jxNA6dpVV7D',
        stripe_price_id_yearly = 'price_1TfSRPCHfNdO9jxNqPNb6MOX',
        monthly_price_cents = 34700,
        yearly_price_cents = 333120
    WHERE slug = 'master';

    RAISE NOTICE 'Master plan updated: monthly=price_1TfSRPCHfNdO9jxNA6dpVV7D, yearly=price_1TfSRPCHfNdO9jxNqPNb6MOX';
END $$;
