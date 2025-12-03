-- ============================================
-- CONFIGURAR CRON JOB PARA NOTIFICAÇÕES AUTOMÁTICAS
-- ============================================
-- IMPORTANTE: Este script deve ser executado no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- PASSO 1: Verificar se a extensão pg_cron está ativada
-- ===============================================
-- Se retornar vazio, você precisa ativar pg_cron em:
-- Dashboard > Database > Extensions > Procure "pg_cron" e clique em Enable

SELECT * FROM pg_extension WHERE extname = 'pg_cron';


-- PASSO 2: Deletar cron job anterior (se existir)
-- ===============================================
SELECT cron.unschedule('process-notifications-hourly');


-- PASSO 3: Criar novo cron job
-- ===============================================
-- IMPORTANTE: Você precisa substituir <SERVICE_ROLE_KEY> pela chave real
-- A chave pode ser encontrada em: Dashboard > Settings > API > service_role (secret)

SELECT cron.schedule(
    'process-notifications-hourly',
    '0 * * * *',  -- Executa todo dia, a cada hora, no minuto 0 (00:00, 01:00, 02:00, etc)
    $$
    SELECT net.http_post(
        url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);


-- PASSO 4: Verificar se foi criado com sucesso
-- ===============================================
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    database
FROM cron.job
WHERE jobname = 'process-notifications-hourly';

-- Deve retornar:
-- jobid | jobname                        | schedule  | active
-- ------|--------------------------------|-----------|--------
-- X     | process-notifications-hourly   | 0 * * * * | true


-- PASSO 5: (OPCIONAL) Para testar AGORA, execute a Edge Function manualmente
-- ===============================================
-- Você também pode fazer isso via curl no terminal ou usando a interface do Supabase

/*
-- No SQL Editor:
SELECT net.http_post(
    url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
) AS request_id;
*/


-- ============================================
-- CONFIGURAÇÕES ALTERNATIVAS DE FREQUÊNCIA
-- ============================================

-- A cada 30 minutos:
-- '*/30 * * * *'

-- A cada 2 horas:
-- '0 */2 * * *'

-- Apenas às 9h e 15h todos os dias:
-- '0 9,15 * * *'

-- Apenas às 9h em dias úteis (seg-sex):
-- '0 9 * * 1-5'

-- A cada 15 minutos durante horário comercial (9h-18h):
-- '*/15 9-18 * * *'


-- ============================================
-- COMANDOS ÚTEIS DE GERENCIAMENTO
-- ============================================

-- Ver histórico de execuções (últimas 20):
/*
SELECT 
    runid,
    status,
    start_time,
    end_time,
    return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly')
ORDER BY start_time DESC
LIMIT 20;
*/

-- Pausar o cron:
/*
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly'),
    active := false
);
*/

-- Reativar o cron:
/*
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly'),
    active := true
);
*/

-- Alterar a frequência:
/*
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly'),
    schedule := '*/30 * * * *'  -- Nova expressão cron
);
*/
