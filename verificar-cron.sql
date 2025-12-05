-- Verificar se o cron job existe e está ativo
SELECT * FROM cron.job WHERE jobname = 'notify-expiring-cashback-daily';

-- Verificar histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'notify-expiring-cashback-daily')
ORDER BY start_time DESC
LIMIT 10;
