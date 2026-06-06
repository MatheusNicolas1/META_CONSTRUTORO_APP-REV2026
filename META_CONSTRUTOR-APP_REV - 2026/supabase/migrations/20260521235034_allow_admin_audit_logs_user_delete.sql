-- Allow LGPD account deletion to preserve audit history without blocking auth.users deletion.
-- Export flows can create admin_audit_logs rows tied to the requesting user; those
-- references must be nulled when the user is deleted.

ALTER TABLE public.admin_audit_logs
  ALTER COLUMN admin_id DROP NOT NULL;

ALTER TABLE public.admin_audit_logs
  DROP CONSTRAINT IF EXISTS admin_audit_logs_admin_id_fkey;

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_admin_id_fkey
  FOREIGN KEY (admin_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.admin_audit_logs
  DROP CONSTRAINT IF EXISTS admin_audit_logs_target_user_id_fkey;

ALTER TABLE public.admin_audit_logs
  ADD CONSTRAINT admin_audit_logs_target_user_id_fkey
  FOREIGN KEY (target_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
