-- ============================================================================
-- MILESTONE 4.4: Stripe Events Table (Idempotency)
-- ============================================================================
-- Tabela para garantir idempotência de webhooks Stripe
-- Armazena eventos processados para evitar duplicação
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Stripe event data
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  
  -- Processing status
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Event payload (for debugging/audit)
  payload JSONB NOT NULL,
  
  -- Processing result
  error TEXT,
  
  -- Metadata
  api_version TEXT,
  
  CONSTRAINT stripe_events_event_id_unique UNIQUE (stripe_event_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON public.stripe_events(created_at DESC);

-- RLS: apenas sistema pode escrever, admins podem ler
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Policy: service_role pode tudo (webhooks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_events' AND policyname = 'Service role can manage stripe events') THEN
        CREATE POLICY "Service role can manage stripe events"
          ON public.stripe_events FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;


