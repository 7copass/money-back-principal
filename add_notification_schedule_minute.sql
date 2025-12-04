-- Adiciona coluna notification_schedule_minute na tabela companies
-- Para permitir especificar minutos no horário de envio das notificações

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS notification_schedule_minute INTEGER DEFAULT 0;

-- Adiciona comentário explicativo
COMMENT ON COLUMN companies.notification_schedule_minute IS 'Minuto do horário de envio das notificações automáticas (0-59)';
