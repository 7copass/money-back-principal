-- Adiciona coluna notification_schedule_minute na tabela companies
-- Para permitir especificar minutos no horário de envio das notificações

-- Passo 1: Adicionar a coluna (se não existir)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS notification_schedule_minute INTEGER;

-- Passo 2: Definir valor padrão para linhas existentes
UPDATE companies
SET notification_schedule_minute = 0
WHERE notification_schedule_minute IS NULL;

-- Passo 3: Tornar a coluna NOT NULL com DEFAULT
ALTER TABLE companies
ALTER COLUMN notification_schedule_minute SET DEFAULT 0;

ALTER TABLE companies
ALTER COLUMN notification_schedule_minute SET NOT NULL;

-- Adiciona comentário explicativo
COMMENT ON COLUMN companies.notification_schedule_minute IS 'Minuto do horário de envio das notificações automáticas (0-59)';
