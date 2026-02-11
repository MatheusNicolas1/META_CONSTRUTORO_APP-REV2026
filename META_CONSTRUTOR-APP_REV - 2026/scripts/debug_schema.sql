-- M8.2: Cleanup helper snippet to investigate failing signup
-- Checking if profiles table has columns that are missed

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';
