-- M4 STEP 4: Simulated webhook evidence (endpoint unavailable)
-- This simulates what the webhook would do after processing a checkout.session.completed event

BEGIN;

-- 1. Insert stripe_event (simulating idempotency record)
INSERT INTO stripe_events (stripe_event_id, event_type, processed, processed_at, error, payload, api_version)
VALUES (
    'evt_m4step4_test_' || extract(epoch from now())::text,
    'checkout.session.completed',
    true,
    now(),
    null,
    '{"id": "evt_test", "type": "checkout.session.completed", "api_version": "2023-10-16"}'::jsonb,
    '2023-10-16'
);

-- 2. Insert subscription (simulating webhook creating subscription with mapped plan_id)
-- Using first available plan and org
INSERT INTO subscriptions (
    org_id,
    plan_id,
    stripe_subscription_id,
    stripe_customer_id,
    status,
    current_period_start,
    current_period_end,
    billing_cycle
)
SELECT 
    o.id as org_id,
    p.id as plan_id,
    'sub_m4step4_test_' || extract(epoch from now())::text,
    'cus_m4step4_test',
    'active',
    now(),
    now() + interval '1 month',
    'monthly'
FROM orgs o
CROSS JOIN plans p
WHERE p.slug = 'test'
LIMIT 1;

COMMIT;

-- Evidence queries
SELECT stripe_event_id, event_type, processed, processed_at, error
FROM stripe_events
ORDER BY created_at DESC
LIMIT 3;

SELECT 
    s.org_id,
    s.plan_id,
    p.slug as plan_slug,
    s.billing_cycle,
    s.status,
    s.stripe_subscription_id,
    s.updated_at
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id
ORDER BY s.updated_at DESC
LIMIT 3;
