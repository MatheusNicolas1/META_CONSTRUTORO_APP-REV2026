-- Migration: Update Plans with Stripe IDs
-- Generated at: 2026-02-15 18:00:00

DO $$
BEGIN
    -- Basic Plan
    UPDATE public.plans
    SET 
        stripe_price_id_monthly = 'price_1T1HSsCHfNdO9jxNJyBqYUW1',
        stripe_price_id_yearly = 'price_1T1HSsCHfNdO9jxN0oT7lsgq'
    WHERE slug = 'basic';

    -- Professional Plan
    UPDATE public.plans
    SET 
        stripe_price_id_monthly = 'price_1T1HSsCHfNdO9jxNDtPicSaZ',
        stripe_price_id_yearly = 'price_1T1HStCHfNdO9jxN2BtTrfpS'
    WHERE slug = 'professional';

    -- Master Plan
    UPDATE public.plans
    SET 
        stripe_price_id_monthly = 'price_1T1HStCHfNdO9jxNsjxKYfjw',
        stripe_price_id_yearly = 'price_1T1HStCHfNdO9jxNpT8KUqLV'
    WHERE slug = 'master';

    -- Premium Plan
    UPDATE public.plans
    SET 
        stripe_price_id_monthly = 'price_1T1HSuCHfNdO9jxNZXGzFFC2',
        stripe_price_id_yearly = 'price_1T1HSuCHfNdO9jxNYdWIg3ia'
    WHERE slug = 'premium';

END $$;
