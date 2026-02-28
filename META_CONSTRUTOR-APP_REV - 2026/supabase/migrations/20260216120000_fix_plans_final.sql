-- Migration to fix plans source of truth
-- 1. Remove PREMIUM plan (does not exist/not wanted)
-- 2. Update BASIC, PROFESSIONAL, MASTER with correct Live Stripe Price IDs
-- 3. Ensure BUSINESS plan exists (Contact Only)

-- 1. Remove Premium
DELETE FROM plans WHERE slug = 'premium';

-- 2. Update Basic (Slug: basic)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd6ICHfNdO9jxNRYj10lkA',
  stripe_price_id_yearly = 'price_1SpdABCHfNdO9jxNzVu49NDP',
  is_active = true,
  name = 'BÁSICO'
WHERE slug = 'basic';

-- 3. Update Professional (Slug: professional)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd7HCHfNdO9jxN3PKJJdyv',
  stripe_price_id_yearly = 'price_1Spd9UCHfNdO9jxNMXy1MQs4',
  is_active = true,
  name = 'PROFISSIONAL'
WHERE slug = 'professional';

-- 4. Update Master (Slug: master)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd7xCHfNdO9jxNiUbb0PKG',
  stripe_price_id_yearly = 'price_1Spd8ZCHfNdO9jxNIcxjZJBm',
  is_active = true,
  name = 'MASTER'
WHERE slug = 'master';

-- 5. Ensure Business exists (Contact Only)
INSERT INTO plans (slug, name, description, features, display_order, is_active, is_popular)
VALUES (
  'business', 
  'BUSINESS', 
  'Para grandes empresas e necessidades personalizadas.',
  '["Usuários ilimitados", "Infraestrutura dedicada", "Customização completa", "Integrações sob medida", "Suporte VIP", "Consultoria estratégica"]'::jsonb,
  10,
  true,
  false
)
ON CONFLICT (slug) DO UPDATE
SET 
  is_active = true,
  monthly_price_cents = NULL,
  yearly_price_cents = NULL,
  stripe_price_id_monthly = NULL,
  stripe_price_id_yearly = NULL;
