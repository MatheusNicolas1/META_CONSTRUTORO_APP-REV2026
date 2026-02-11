-- Verification Script for Analytics DB (M9 Task D.1)

-- 1. Check Table Existence
SELECT to_regclass('public.analytics_events') as table_exists;

-- 2. Check Event Counts
SELECT event, count(*) as count 
FROM public.analytics_events 
GROUP BY event 
ORDER BY count DESC;

-- 3. Sample Data Inspection
SELECT 
    created_at, 
    source, 
    event, 
    org_id, 
    user_id, 
    request_id, 
    success 
FROM public.analytics_events 
ORDER BY created_at DESC 
LIMIT 10;
