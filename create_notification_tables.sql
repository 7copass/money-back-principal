-- Create notification_templates table for storing customizable message templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'expiration_7d', 'expiration_5d', 'expiration_3d', 'expiration_2d', 'expiration_today'
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, notification_type)
);

-- Create notification_log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed'
    error_message TEXT,
    UNIQUE(transaction_id, notification_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_company ON notification_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_company ON notification_log(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_transaction ON notification_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);

-- Insert default templates for all companies
INSERT INTO notification_templates (company_id, notification_type, message_template, is_active)
SELECT 
    id as company_id,
    'expiration_7d' as notification_type,
    'Olá {cliente_nome}! Você tem R$ {cashback_valor} em cashback que vence em {dias_restantes} dias ({data_vencimento}). Não perca! 🎁' as message_template,
    true as is_active
FROM companies
ON CONFLICT (company_id, notification_type) DO NOTHING;

INSERT INTO notification_templates (company_id, notification_type, message_template, is_active)
SELECT 
    id as company_id,
    'expiration_5d' as notification_type,
    'Atenção {cliente_nome}! Faltam apenas {dias_restantes} dias para seu cashback de R$ {cashback_valor} vencer. Use antes de {data_vencimento}! ⏰' as message_template,
    true as is_active
FROM companies
ON CONFLICT (company_id, notification_type) DO NOTHING;

INSERT INTO notification_templates (company_id, notification_type, message_template, is_active)
SELECT 
    id as company_id,
    'expiration_3d' as notification_type,
    '⚠️ {cliente_nome}, seu cashback de R$ {cashback_valor} vence em {dias_restantes} dias! Resgate já! 💰' as message_template,
    true as is_active
FROM companies
ON CONFLICT (company_id, notification_type) DO NOTHING;

INSERT INTO notification_templates (company_id, notification_type, message_template, is_active)
SELECT 
    id as company_id,
    'expiration_2d' as notification_type,
    '🚨 URGENTE {cliente_nome}! Faltam apenas 2 dias para perder R$ {cashback_valor}! Vence em {data_vencimento}! 🚨' as message_template,
    true as is_active
FROM companies
ON CONFLICT (company_id, notification_type) DO NOTHING;

INSERT INTO notification_templates (company_id, notification_type, message_template, is_active)
SELECT 
    id as company_id,
    'expiration_today' as notification_type,
    '⏰ ÚLTIMO DIA {cliente_nome}! Seu cashback de R$ {cashback_valor} vence HOJE! Resgate agora! ⚡' as message_template,
    true as is_active
FROM companies
ON CONFLICT (company_id, notification_type) DO NOTHING;
