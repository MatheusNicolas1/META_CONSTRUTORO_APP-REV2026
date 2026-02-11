-- 8.1.3 A: SQL Validation of Rate Limit Logic

-- Reset for clean test
DELETE FROM rate_limits WHERE key = 'test:key';

-- 1. First Request (Allowed)
SELECT allowed, remaining, reset_at FROM check_rate_limit('test:key', 60, 2);

-- 2. Second Request (Allowed, remaining 0)
SELECT allowed, remaining, reset_at FROM check_rate_limit('test:key', 60, 2);

-- 3. Third Request (Blocked, allowed false)
SELECT allowed, remaining, reset_at FROM check_rate_limit('test:key', 60, 2);

-- Cleanup
DELETE FROM rate_limits WHERE key = 'test:key';
