-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';

-- Verify table again
SELECT to_regclass('public.analytics_events');
