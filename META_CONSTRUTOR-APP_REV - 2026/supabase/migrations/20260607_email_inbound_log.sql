-- Tabela de log para e-mails recebidos via Resend
CREATE TABLE IF NOT EXISTS email_inbound_log (
  id BIGSERIAL PRIMARY KEY,
  email_id TEXT NOT NULL UNIQUE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body_preview TEXT,
  received_at TIMESTAMPTZ,
  needs_human BOOLEAN DEFAULT FALSE,
  reason TEXT,
  lead_interest TEXT,
  lead_phone TEXT,
  reply_sent BOOLEAN DEFAULT FALSE,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_inbound_from ON email_inbound_log(from_email);
CREATE INDEX IF NOT EXISTS idx_email_inbound_created ON email_inbound_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_inbound_needs_human ON email_inbound_log(needs_human) WHERE needs_human = TRUE;
