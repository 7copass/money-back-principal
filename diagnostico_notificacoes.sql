-- ============================================
-- DIAGNÓSTICO DO SISTEMA DE NOTIFICAÇÕES
-- ============================================

-- 1. VERIFICAR SE O CRON JOB EXISTE E ESTÁ ATIVO
-- ===============================================
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    database,
    nodename
FROM cron.job
WHERE jobname LIKE '%notification%';

-- Resultado esperado:
-- jobid | jobname                        | schedule  | active
-- ------|--------------------------------|-----------|--------
-- X     | process-notifications-hourly   | 0 * * * * | true

-- Se não retornar nada, o cron não está criado!


-- 2. VERIFICAR ÚLTIMAS EXECUÇÕES DO CRON
-- ===============================================
SELECT 
    jobid,
    runid,
    status,
    return_message,
    start_time,
    end_time,
    (end_time - start_time) as duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Se não há execuções recentes = cron não está rodando


-- 3. VERIFICAR CONFIGURAÇÕES DA EMPRESA
-- ===============================================
SELECT 
    id,
    name,
    notifications_enabled,
    notification_delay_min,
    notification_delay_max,
    notification_schedule_hour
FROM companies;

-- notifications_enabled deve ser TRUE


-- 4. VERIFICAR TEMPLATES ATIVOS
-- ===============================================
SELECT 
    nt.id,
    c.name as empresa,
    nt.notification_type,
    nt.is_active,
    nt.schedule_hour,
    LEFT(nt.message_template, 50) as mensagem_preview
FROM notification_templates nt
JOIN companies c ON nt.company_id = c.id
ORDER BY c.name, nt.notification_type;

-- Verificar:
-- - is_active = true
-- - schedule_hour está definido (0-23)


-- 5. VERIFICAR TRANSAÇÕES ELEGÍVEIS PARA NOTIFICAÇÃO
-- ===============================================
SELECT 
    c.name as empresa,
    cl.name as cliente,
    cl.phone,
    t.cashback_value,
    t.cashback_expiration_date,
    t.cashback_redeemed,
    EXTRACT(DAY FROM (t.cashback_expiration_date - CURRENT_DATE)) as dias_ate_vencimento
FROM transactions t
JOIN companies c ON t.company_id = c.id
JOIN clients cl ON t.client_id = cl.id
WHERE t.cashback_redeemed = false
  AND t.cashback_expiration_date IS NOT NULL
  AND t.cashback_expiration_date >= CURRENT_DATE
ORDER BY t.cashback_expiration_date;

-- Deve retornar transações com cashback não resgatado


-- 6. VERIFICAR NOTIFICAÇÕES JÁ ENVIADAS (ÚLTIMAS 24H)
-- ===============================================
SELECT 
    nl.sent_at,
    c.name as empresa,
    cl.name as cliente,
    nl.notification_type,
    t.cashback_value,
    nl.status,
    nl.error_message
FROM notification_log nl
JOIN companies c ON nl.company_id = c.id
JOIN clients cl ON nl.client_id = cl.id
JOIN transactions t ON nl.transaction_id = t.id
WHERE nl.sent_at > NOW() - INTERVAL '24 hours'
ORDER BY nl.sent_at DESC;


-- 7. VERIFICAR TIMEZONE DO SERVIDOR
-- ===============================================
SELECT 
    NOW() as horario_atual,
    CURRENT_DATE as data_atual,
    EXTRACT(HOUR FROM NOW()) as hora_atual,
    CURRENT_SETTING('TIMEZONE') as timezone;


-- 8. ESTATÍSTICAS GERAIS
-- ===============================================
SELECT 
    'Total de templates' as metrica,
    COUNT(*)::TEXT as valor
FROM notification_templates
WHERE is_active = true

UNION ALL

SELECT 
    'Total de transações elegíveis' as metrica,
    COUNT(*)::TEXT as valor
FROM transactions
WHERE cashback_redeemed = false
  AND cashback_expiration_date IS NOT NULL
  AND cashback_expiration_date >= CURRENT_DATE

UNION ALL

SELECT 
    'Notificações enviadas (24h)' as metrica,
    COUNT(*)::TEXT as valor
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
  AND status = 'sent'

UNION ALL

SELECT 
    'Notificações com erro (24h)' as metrica,
    COUNT(*)::TEXT as valor
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
  AND status = 'failed';


-- ============================================
-- COMANDOS DE CORREÇÃO (SE NECESSÁRIO)
-- ============================================

-- CRIAR CRON JOB (se não existir)
-- ===============================================
-- IMPORTANTE: Substituir <SERVICE_ROLE_KEY> pela chave real

/*
SELECT cron.schedule(
    'process-notifications-hourly',
    '0 * * * *',  -- A cada hora no minuto 0
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
*/


-- ATIVAR NOTIFICAÇÕES NA EMPRESA (se desativado)
-- ===============================================
/*
UPDATE companies 
SET notifications_enabled = true
WHERE id = 'COMPANY_ID_AQUI';
*/


-- ATIVAR UM TEMPLATE ESPECÍFICO
-- ===============================================
/*
UPDATE notification_templates
SET is_active = true
WHERE company_id = 'COMPANY_ID_AQUI'
  AND notification_type = 'expiration_3d';
*/


-- DEFINIR HORÁRIO DO TEMPLATE (se NULL)
-- ===============================================
/*
UPDATE notification_templates
SET schedule_hour = 9  -- 9h da manhã
WHERE schedule_hour IS NULL;
*/


-- LIMPAR LOG DE NOTIFICAÇÕES (para re-testar)
-- ===============================================
-- ATENÇÃO: Isso permite que notificações sejam reenviadas!
/*
DELETE FROM notification_log
WHERE notification_type = 'expiration_3d'
  AND transaction_id = 'TRANSACTION_ID_AQUI';
*/


-- REATIVAR CRON (se pausado)
-- ===============================================
/*
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly'),
    active := true
);
*/


-- DELETAR E RECRIAR CRON (último recurso)
-- ===============================================
/*
-- 1. Deletar
SELECT cron.unschedule('process-notifications-hourly');

-- 2. Recriar (usar o SQL de criação acima)
*/
