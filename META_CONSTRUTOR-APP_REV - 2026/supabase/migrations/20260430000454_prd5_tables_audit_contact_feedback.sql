CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rdos ADD COLUMN IF NOT EXISTS aprovado_por_id UUID REFERENCES auth.users(id);
ALTER TABLE rdos ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ;

ALTER TABLE checklists ADD COLUMN IF NOT EXISTS aprovado_por_id UUID REFERENCES auth.users(id);
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ;;
