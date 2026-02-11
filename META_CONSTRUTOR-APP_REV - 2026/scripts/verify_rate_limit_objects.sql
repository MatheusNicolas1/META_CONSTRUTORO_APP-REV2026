-- 8.1.1 Verify Rate Limit Objects
SELECT to_regclass('public.rate_limits') as table_exists;
SELECT proname FROM pg_proc WHERE proname = 'check_rate_limit';
SELECT pg_get_functiondef('public.check_rate_limit'::regproc);
