-- Audit Log Evidence
SELECT created_at, action, entity, metadata
FROM public.audit_logs
WHERE action IN ('domain.rdo_status_changed','domain.quality_item_status_changed')
ORDER BY created_at DESC
LIMIT 5;
