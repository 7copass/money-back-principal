# 📱 Sistema de Notificações Automáticas - Documentação Técnica

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes](#componentes)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Configuração](#configuração)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)
8. [Manutenção](#manutenção)

---

## 🎯 Visão Geral

### O que é?

Sistema automatizado que envia notificações via WhatsApp para clientes quando seus cashbacks estão próximos de expirar.

### Objetivo

Aumentar o engajamento e a retenção de clientes, lembrando-os de resgatar seus cashbacks antes do vencimento.

### Características Principais

- ✅ **Totalmente automático**: Roda 24/7 sem intervenção manual
- ✅ **Escalável**: Suporta múltiplas empresas simultaneamente
- ✅ **Personalizável**: Cada empresa configura seus próprios templates e horários
- ✅ **Rastreável**: Todas as tentativas de envio são registradas
- ✅ **Resiliente**: Continua funcionando mesmo se ocorrerem falhas parciais

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│                                                             │
│  ┌──────────────┐         ┌─────────────────┐             │
│  │  PostgreSQL  │         │  pg_cron        │             │
│  │  Database    │◄────────│  Extension      │             │
│  │              │         │  (Scheduler)    │             │
│  └──────┬───────┘         └────────┬────────┘             │
│         │                          │                       │
│         │ Consulta dados           │ Dispara a cada hora  │
│         │                          │                       │
│  ┌──────▼──────────────────────────▼────────┐             │
│  │     Edge Function                        │             │
│  │     process-notifications                │             │
│  │     (Deno Deploy)                        │             │
│  └──────────────────┬───────────────────────┘             │
│                     │                                      │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │
              ┌───────▼────────┐
              │  Evolution API │
              │  (WhatsApp)    │
              └───────┬────────┘
                      │
                      │ Envia mensagem
                      │
              ┌───────▼────────┐
              │    Cliente     │
              │   WhatsApp     │
              └────────────────┘
```

### Tecnologias Utilizadas

- **Supabase**: Banco de dados e hospedagem de Edge Functions
- **PostgreSQL**: Banco de dados relacional
- **pg_cron**: Extensão PostgreSQL para agendamento de tarefas
- **Deno Deploy**: Runtime serverless para Edge Functions
- **Evolution API**: API para integração com WhatsApp
- **TypeScript**: Linguagem de programação

---

## 🧩 Componentes

### 1. Banco de Dados

#### Tabelas Principais

##### `notification_templates`
Armazena os templates de mensagens configurados por cada empresa.

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  notification_type TEXT,
  message_template TEXT,
  is_active BOOLEAN,
  schedule_hour INTEGER,  -- Hora do dia (0-23) para enviar
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Tipos de notificação:**
- `expiration_7d`: 7 dias antes do vencimento
- `expiration_5d`: 5 dias antes do vencimento
- `expiration_3d`: 3 dias antes do vencimento
- `expiration_2d`: 2 dias antes do vencimento
- `expiration_today`: No dia do vencimento

**Variáveis disponíveis nos templates:**
- `{cliente_nome}`: Nome do cliente
- `{cliente_cpf}`: CPF do cliente
- `{cashback_valor}`: Valor do cashback
- `{dias_restantes}`: Dias até o vencimento
- `{data_vencimento}`: Data de vencimento formatada
- `{empresa_nome}`: Nome da empresa

##### `notification_log`
Registra todas as tentativas de envio de notificações.

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  transaction_id UUID REFERENCES transactions(id),
  notification_type TEXT,
  status TEXT,  -- 'sent' ou 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ
);
```

##### `companies`
Armazena configurações globais de notificação por empresa.

```sql
-- Campos relevantes:
notifications_enabled BOOLEAN,
notification_delay_min INTEGER,  -- Delay mínimo entre envios (segundos)
notification_delay_max INTEGER,  -- Delay máximo entre envios (segundos)
notification_schedule_hour INTEGER  -- Horário global (DEPRECATED - usar schedule_hour do template)
```

##### `transactions`
Armazena transações com informações de cashback.

```sql
-- Campos relevantes:
cashback_value DECIMAL,
cashback_expiration_date DATE,
cashback_redeemed BOOLEAN
```

---

### 2. Edge Function

**Localização:** `supabase/functions/process-notifications/index.ts`

**Responsabilidades:**
1. Buscar todas as empresas com notificações ativas
2. Para cada empresa:
   - Buscar templates ativos
   - Buscar transações com cashback não resgatado
   - Calcular dias até o vencimento
   - Verificar se já foi enviada notificação
   - Verificar se está no horário correto do template
   - Enviar mensagem via Evolution API
   - Registrar tentativa no log

**Variáveis de Ambiente:**
- `SUPABASE_URL`: URL do projeto Supabase (automática)
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (automática)
- `EVOLUTION_API_URL`: URL da Evolution API
- `EVOLUTION_API_KEY`: Chave de autenticação da Evolution API

**Endpoint:**
```
POST https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications
Authorization: Bearer <SERVICE_ROLE_KEY>
```

---

### 3. Cron Job (pg_cron)

**Configuração:**
```sql
SELECT cron.schedule(
  'process-notifications-hourly',
  '0 * * * *',  -- Executa no minuto 00 de cada hora
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
```

**Horários de execução:**
- 00:00, 01:00, 02:00, ..., 23:00 (todos os dias)

---

### 4. Interface (Frontend)

#### WhatsApp Connection Page

**Localização:** `pages.tsx` → `WhatsAppConnectionPage`

**Abas:**
- **🔌 Conexão**: Gerenciamento da conexão WhatsApp
- **📋 Histórico de Envios**: Visualização de notificações enviadas

#### Notification Templates Section

**Localização:** `pages.tsx` → `NotificationTemplatesSection`

**Funcionalidades:**
- Ativar/desativar templates
- Editar mensagens
- Configurar horário de envio por template
- Configurações globais de notificação
- Botão "Processar Agora" (para testes manuais)

#### Notification History Tab

**Localização:** `NotificationHistoryTab.tsx`

**Exibe:**
- Data e hora de envio
- Nome e telefone do cliente
- Tipo de notificação
- Valor do cashback
- Status (sucesso/falha)

---

## 🔄 Fluxo de Funcionamento

### Fluxo Completo

```
1. CRON DISPARA (topo de cada hora)
   ↓
2. Chama Edge Function via HTTP POST
   ↓
3. Edge Function:
   ├─ Busca empresas com notificações ativas
   ├─ Para cada empresa:
   │  ├─ Busca templates ativos
   │  ├─ Busca transações com cashback não resgatado
   │  ├─ Para cada transação:
   │  │  ├─ Calcula dias até vencimento
   │  │  ├─ Determina tipo de notificação (7d, 5d, 3d, 2d, today)
   │  │  ├─ Verifica se já foi enviado
   │  │  ├─ Busca template correspondente
   │  │  ├─ Verifica horário do template
   │  │  ├─ Se horário correto:
   │  │  │  ├─ Substitui variáveis no template
   │  │  │  ├─ Envia via Evolution API
   │  │  │  └─ Registra no notification_log
   │  │  └─ Se horário errado: pula
   │  └─ Retorna estatísticas
   └─ Retorna resposta HTTP
```

### Exemplo Prático

**Cenário:** Cliente com cashback de R$ 50,00 expirando em 3 dias.

**13:00h - Cron executa:**
1. Edge Function identifica que faltam 3 dias
2. Tipo de notificação: `expiration_3d`
3. Busca template `expiration_3d` da empresa
4. Template configurado para enviar às **14h**
5. Hora atual: **13h** → ❌ Pula (horário errado)

**14:00h - Cron executa:**
1. Edge Function identifica que faltam 3 dias
2. Tipo de notificação: `expiration_3d`
3. Busca template `expiration_3d` da empresa
4. Template configurado para enviar às **14h**
5. Hora atual: **14h** → ✅ Envia!
6. Substitui variáveis:
   ```
   Olá {cliente_nome}! 
   Você tem R$ {cashback_valor} em cashback.
   Vence em {dias_restantes} dias!
   ```
   ↓
   ```
   Olá João Silva! 
   Você tem R$ 50.00 em cashback.
   Vence em 3 dias!
   ```
7. Envia via WhatsApp
8. Registra no log como "sent"

**15:00h - Cron executa:**
1. Edge Function identifica que faltam 3 dias
2. Verifica no `notification_log`: ✅ Já foi enviado
3. Pula (evita duplicação)

---

## ⚙️ Configuração

### Configuração Inicial (Deploy)

Veja o guia completo: [`docs/edge_function_deploy_guide.md`](../edge_function_deploy_guide.md)

**Resumo:**
1. Instalar Supabase CLI
2. Login e link com projeto
3. Configurar secrets (Evolution API)
4. Deploy da Edge Function
5. Ativar pg_cron
6. Criar cron job

### Configuração por Empresa (Interface)

**Acesso:** Dashboard → WhatsApp → Conexão

#### 1. Configurações Globais

- **Notificações Automáticas**: ON/OFF geral
- **Horário de Envio**: DEPRECATED (usar horário por template)
- **Delay Mínimo/Máximo**: Intervalo entre envios (segundos)

#### 2. Templates por Tipo

Para cada tipo de notificação (7d, 5d, 3d, 2d, today):

- **Ativar/Desativar**: Toggle
- **Mensagem**: Editor de texto com variáveis
- **Horário de Envio**: Hora do dia (0-23)

**Exemplo de Configuração:**

```
Expiration 7d:
- Ativo: ✅
- Horário: 9h
- Mensagem: "Olá {cliente_nome}! Seu cashback de R$ {cashback_valor} vence em 7 dias!"

Expiration 3d:
- Ativo: ✅
- Horário: 14h
- Mensagem: "⚠️ Atenção {cliente_nome}! Faltam apenas 3 dias para seu cashback de R$ {cashback_valor} expirar!"

Expiration Today:
- Ativo: ✅
- Horário: 10h
- Mensagem: "🚨 ÚLTIMO DIA! {cliente_nome}, seu cashback de R$ {cashback_valor} expira HOJE!"
```

---

## 📊 Monitoramento

### 1. Verificar Status do Cron

**SQL Editor:**
```sql
-- Ver cron jobs ativos
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job;
```

**Resultado esperado:**
```
jobid | jobname                        | schedule    | active
------|--------------------------------|-------------|--------
1     | process-notifications-hourly   | 0 * * * *   | true
```

### 2. Histórico de Execuções do Cron

**SQL Editor:**
```sql
-- Últimas 20 execuções do cron
SELECT 
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = 1  -- ID do job
ORDER BY start_time DESC
LIMIT 20;
```

**Status possíveis:**
- `succeeded`: Execução bem-sucedida
- `failed`: Falha na execução

### 3. Ver Notificações Enviadas

**SQL Editor:**
```sql
-- Notificações das últimas 24h
SELECT 
  nl.sent_at,
  c.name as empresa,
  cl.name as cliente,
  cl.phone as telefone,
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
```

### 4. Estatísticas por Empresa

**SQL Editor:**
```sql
-- Resumo de envios por empresa (últimos 7 dias)
SELECT 
  c.name as empresa,
  COUNT(*) as total_envios,
  COUNT(*) FILTER (WHERE nl.status = 'sent') as enviados,
  COUNT(*) FILTER (WHERE nl.status = 'failed') as falhados,
  ROUND(100.0 * COUNT(*) FILTER (WHERE nl.status = 'sent') / COUNT(*), 2) as taxa_sucesso
FROM notification_log nl
JOIN companies c ON nl.company_id = c.id
WHERE nl.sent_at > NOW() - INTERVAL '7 days'
GROUP BY c.name
ORDER BY total_envios DESC;
```

### 5. Ver Logs da Edge Function

**Terminal:**
```bash
supabase functions logs process-notifications --limit 100
```

**Ou no Dashboard:**
- Edge Functions → process-notifications → Logs

### 6. Interface - Histórico

**Acesso:** Dashboard → WhatsApp → Histórico de Envios

Exibe visualmente:
- Data/hora
- Cliente
- Tipo
- Valor
- Status

---

## 🔧 Troubleshooting

### Problema: Notificações não estão sendo enviadas

**Verificações:**

#### 1. Cron está ativo?
```sql
SELECT * FROM cron.job WHERE jobname = 'process-notifications-hourly';
```
- Se não existir: Reexecutar SQL de criação do cron
- Se `active = false`: Ativar com `SELECT cron.alter_job(1, active := true);`

#### 2. Cron está executando?
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = 1 
ORDER BY start_time DESC 
LIMIT 5;
```
- Se não há execuções recentes: Verificar configuração do cron
- Se status = 'failed': Ver `return_message` para detalhes

#### 3. Edge Function está respondendo?
```bash
curl -X POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'Content-Type: application/json'
```
- Deve retornar: `{"success": true, "processed": X, ...}`

#### 4. Templates estão ativos?
```sql
SELECT company_id, notification_type, is_active, schedule_hour
FROM notification_templates
WHERE company_id = '<COMPANY_ID>';
```
- Verificar se `is_active = true`
- Verificar se `schedule_hour` está configurado

#### 5. Há transações pendentes?
```sql
SELECT COUNT(*)
FROM transactions
WHERE company_id = '<COMPANY_ID>'
  AND cashback_redeemed = false
  AND cashback_expiration_date IS NOT NULL
  AND cashback_expiration_date >= CURRENT_DATE;
```
- Se zero: Não há cashbacks para notificar

#### 6. Evolution API está funcionando?
- Verificar conexão WhatsApp na interface
- Testar envio manual de mensagem

### Problema: Notificações duplicadas

**Causa:** Log não está sendo registrado corretamente.

**Solução:**
```sql
-- Verificar se há índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_log_unique 
ON notification_log(transaction_id, notification_type);
```

### Problema: Notificações no horário errado

**Verificações:**

#### 1. Fuso horário do servidor
```sql
SHOW timezone;
```

#### 2. Horário configurado no template
```sql
SELECT notification_type, schedule_hour 
FROM notification_templates
WHERE company_id = '<COMPANY_ID>';
```

#### 3. Horário atual do servidor
```sql
SELECT NOW(), EXTRACT(HOUR FROM NOW());
```

### Problema: Edge Function com erro

**Ver logs detalhados:**
```bash
supabase functions logs process-notifications --limit 50
```

**Erros comuns:**

- `Evolution API error`: Verificar URL e API Key nas secrets
- `Access denied`: Verificar service_role_key no cron
- `Timeout`: Muitas notificações ao mesmo tempo (aumentar delay)

---

## 🔨 Manutenção

### Atualizar Edge Function

**1. Editar código:**
```bash
cd /Users/victorhugosantanaalmeida/Downloads/fidelify---cashback-platform
nano supabase/functions/process-notifications/index.ts
```

**2. Deploy:**
```bash
supabase functions deploy process-notifications
```

**3. Testar:**
```bash
curl -X POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
```

### Atualizar Secrets (Evolution API)

```bash
# URL da API
supabase secrets set EVOLUTION_API_URL=https://nova-url.com

# API Key
supabase secrets set EVOLUTION_API_KEY=nova-key

# Listar secrets
supabase secrets list
```

**IMPORTANTE:** Após atualizar secrets, fazer redeploy da função!

### Alterar Horário do Cron

**Formatos de cron expression:**

```
┌─────── minuto (0-59)
│ ┌───── hora (0-23)
│ │ ┌─── dia do mês (1-31)
│ │ │ ┌─ mês (1-12)
│ │ │ │ ┌ dia da semana (0-6, domingo = 0)
│ │ │ │ │
* * * * *
```

**Exemplos:**

```sql
-- De hora em hora (atual)
'0 * * * *'

-- De 2 em 2 horas
'0 */2 * * *'

-- Apenas às 9h e 15h
'0 9,15 * * *'

-- A cada 30 minutos
'*/30 * * * *'

-- Apenas dias úteis (seg-sex) às 9h
'0 9 * * 1-5'
```

**Atualizar:**
```sql
SELECT cron.alter_job(
  1,  -- job_id
  schedule := '0 */2 * * *'  -- nova expressão
);
```

### Pausar/Retomar Cron

**Pausar:**
```sql
SELECT cron.alter_job(1, active := false);
```

**Retomar:**
```sql
SELECT cron.alter_job(1, active := true);
```

### Deletar Cron

```sql
SELECT cron.unschedule('process-notifications-hourly');
```

### Limpar Logs Antigos

```sql
-- Deletar logs com mais de 30 dias
DELETE FROM notification_log 
WHERE sent_at < NOW() - INTERVAL '30 days';

-- Arquivar logs antigos (alternativa)
CREATE TABLE notification_log_archive AS
SELECT * FROM notification_log
WHERE sent_at < NOW() - INTERVAL '90 days';

DELETE FROM notification_log 
WHERE sent_at < NOW() - INTERVAL '90 days';
```

### Adicionar Novo Tipo de Notificação

**1. Definir nova lógica na Edge Function:**

```typescript
// Em processCompanyNotifications()
if (daysUntilExpiration === 1) notificationType = 'expiration_1d'
```

**2. Criar template no banco:**

```sql
INSERT INTO notification_templates (
  company_id,
  notification_type,
  message_template,
  is_active,
  schedule_hour
) VALUES (
  '<COMPANY_ID>',
  'expiration_1d',
  'Olá {cliente_nome}! Amanhã é o último dia! Seu cashback de R$ {cashback_valor} expira em 24h!',
  true,
  16
);
```

**3. Adicionar label no frontend:**

```typescript
// Em NotificationTemplatesSection
const templateLabels: Record<string, string> = {
  'expiration_7d': '7 Dias Antes',
  'expiration_5d': '5 Dias Antes',
  'expiration_3d': '3 Dias Antes',
  'expiration_2d': '2 Dias Antes',
  'expiration_1d': '1 Dia Antes',  // NOVO
  'expiration_today': 'No Dia do Vencimento'
};
```

**4. Redeploy da Edge Function:**
```bash
supabase functions deploy process-notifications
```

---

## 📝 Referências Técnicas

### Arquivos Principais

```
fidelify---cashback-platform/
├── supabase/
│   └── functions/
│       └── process-notifications/
│           └── index.ts              # Edge Function principal
├── pages.tsx                         # Interface de configuração
├── NotificationHistoryTab.tsx        # Histórico de envios
├── services.ts                       # API calls do frontend
└── docs/
    ├── NOTIFICACOES_AUTOMATICAS.md           # Esta documentação
    └── edge_function_deploy_guide.md         # Guia de deploy
```

### Endpoints

- **Edge Function:** `https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications`
- **Evolution API:** Configurado via secret `EVOLUTION_API_URL`

### Contatos e Suporte

- **Supabase Dashboard:** https://app.supabase.com
- **Project ID:** `phznyksqgtanfqcphvod`

---

**Última atualização:** 2025-12-02  
**Versão:** 1.0.0
