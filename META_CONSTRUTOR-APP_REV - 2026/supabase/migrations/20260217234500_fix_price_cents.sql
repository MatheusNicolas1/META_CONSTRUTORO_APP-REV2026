-- Migration to fix plan prices in cents
-- Updates monthly_price_cents and yearly_price_cents to match proper values

-- 1. Update Basic (Slug: basic)
UPDATE plans
SET 
  monthly_price_cents = 12990,  -- R$ 129,90
  yearly_price_cents = 124704   -- R$ 1.247,04
WHERE slug = 'basic';

-- 2. Update Professional (Slug: professional)
UPDATE plans
SET 
  monthly_price_cents = 19990,  -- R$ 199,90
  yearly_price_cents = 191904   -- R$ 1.919,04
WHERE slug = 'professional';

-- 3. Update Master (Slug: master)
UPDATE plans
SET 
  monthly_price_cents = 49990,  -- R$ 499,90
  yearly_price_cents = 479904   -- R$ 4.799,04
WHERE slug = 'master';
