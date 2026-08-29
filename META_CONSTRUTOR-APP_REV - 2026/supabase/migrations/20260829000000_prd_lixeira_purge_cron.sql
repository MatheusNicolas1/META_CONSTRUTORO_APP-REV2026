-- PRD_LIXEIRA: expurgo automático (30 dias) via pg_cron.
-- Agenda app_private.purge_expired_lixeira_items() para rodar diariamente,
-- apagando definitivamente itens cujo purge_at (deleted_at + 30 dias) já venceu.
--
-- Idempotente: remove o job existente antes de reagendar, para não duplicar.

select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-expired-lixeira-items';

select cron.schedule(
  'purge-expired-lixeira-items',
  '0 4 * * *',  -- diariamente às 04:00 UTC (01:00 BRT)
  $$ select app_private.purge_expired_lixeira_items(); $$
);
