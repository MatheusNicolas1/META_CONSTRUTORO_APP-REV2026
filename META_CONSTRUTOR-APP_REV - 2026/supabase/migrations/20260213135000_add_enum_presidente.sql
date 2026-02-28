-- Add 'Presidente' to app_role enum
-- Created separately to avoid 55P04 (unsafe usage in same transaction)

DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Presidente';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
