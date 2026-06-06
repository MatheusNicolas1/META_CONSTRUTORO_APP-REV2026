-- Reconcile RDO approval state with the frontend/Edge Function contract.
-- Remote drift found on 2026-05-20: rdos_status_check accepted only legacy
-- Portuguese labels, while the app creates RDOs with DRAFT/SUBMITTED/etc.

ALTER TABLE public.rdos
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

UPDATE public.rdos
SET
  approved_by = COALESCE(approved_by, aprovado_por_id),
  approved_at = COALESCE(approved_at, data_aprovacao),
  rejection_reason = COALESCE(rejection_reason, motivo_rejeicao);

ALTER TABLE public.rdos
  DROP CONSTRAINT IF EXISTS rdos_status_check;

UPDATE public.rdos
SET status = CASE status
  WHEN 'Em elaboração' THEN 'DRAFT'
  WHEN 'Aguardando aprovação' THEN 'SUBMITTED'
  WHEN 'Aprovado' THEN 'APPROVED'
  WHEN 'Rejeitado' THEN 'REJECTED'
  ELSE status
END
WHERE status IN ('Em elaboração', 'Aguardando aprovação', 'Aprovado', 'Rejeitado');

ALTER TABLE public.rdos
  ADD CONSTRAINT rdos_status_check
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'));

ALTER TABLE public.rdos
  ALTER COLUMN status SET DEFAULT 'DRAFT';

COMMENT ON COLUMN public.rdos.approved_by IS 'Approver user id for the RDO approval workflow.';
COMMENT ON COLUMN public.rdos.approved_at IS 'Timestamp when the RDO was approved or rejected.';
COMMENT ON COLUMN public.rdos.rejection_reason IS 'Required reason provided when an RDO is rejected.';
