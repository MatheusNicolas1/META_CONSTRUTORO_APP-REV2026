-- ============================================================================
-- MIGRATION: 20260216120000_add_subscription_price_id.sql
-- OBJECTIVE: Add stripe_price_id to subscriptions table
-- ============================================================================

DO $$ 
BEGIN
    -- Add stripe_price_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN stripe_price_id TEXT;
    END IF;

    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_price_id ON public.subscriptions(stripe_price_id);
END $$;
