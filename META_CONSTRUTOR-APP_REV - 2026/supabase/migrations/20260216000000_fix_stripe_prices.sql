-- 1. BASIC (Slug: basic)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd6ICHfNdO9jxNRYj10lkA',
  stripe_price_id_yearly = 'price_1SpdABCHfNdO9jxNzVu49NDP'
WHERE slug = 'basic';

-- 2. PROFESSIONAL (Slug: professional)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd7HCHfNdO9jxN3PKJJdyv',
  stripe_price_id_yearly = 'price_1Spd9UCHfNdO9jxNMXy1MQs4'
WHERE slug = 'professional';

-- 3. MASTER (Slug: master)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1Spd7xCHfNdO9jxNiUbb0PKG',
  stripe_price_id_yearly = 'price_1Spd8ZCHfNdO9jxNIcxjZJBm'
WHERE slug = 'master';

-- 4. PREMIUM (Slug: premium)
UPDATE plans
SET 
  stripe_price_id_monthly = 'price_1T1JzYCHfNdO9jxNtf6YceHL',
  stripe_price_id_yearly = 'price_1T1JzcCHfNdO9jxNQNaRQtcD'
WHERE slug = 'premium';
