# 🔧 Guia de Correção: Notificações Automáticas Não Funcionando

## 📊 Diagnóstico do Problema

Você testou as notificações automáticas e elas não estão sendo enviadas. As causas mais comuns são:

1. ❌ **Cron job não está configurado** (mais provável)
2. ❌ **Cron job está pausado/inativo**
3. ❌ **Horário do template não coincide com hora atual**
4. ❌ **Templates estão desativados**
5. ❌ **Notificações estão desabilitadas na empresa**
6. ❌ **Edge Function com erro**

---

## 🎯 Solução Rápida (Passo-a-Passo)

### ✅ PASSO 1: Acessar o Supabase Dashboard

1. Abra: https://app.supabase.com
2. Selecione o projeto: **Fideliffidelify---cashback-platform/**
3. Project ID: `phznyksqgtanfqcphvod`

---

### ✅ PASSO 2: Verificar se o Cron Job Existe

**Dashboard > SQL Editor > New Query**

Cole e execute:
```sql
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname LIKE '%notification%';
```

**Resultado esperado:**
```
jobid | jobname                        | schedule  | active
------|--------------------------------|-----------|--------
1     | process-notifications-hourly   | 0 * * * * | true
```

**Se retornar VAZIO:**
👉 O cron job não foi criado! Vá para **PASSO 3**

**Se retornar com `active = false`:**
👉 O cron está pausado! Execute:
```sql
SELECT cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly'),
    active := true
);
```

---

### ✅ PASSO 3: Criar o Cron Job (SE NÃO EXISTIR)

**IMPORTANTE:** Você precisa da **SERVICE_ROLE_KEY**

#### 3.1. Obter a SERVICE_ROLE_KEY

1. Dashboard > **Settings** > **API**
2. Procure por: **service_role** (secret)
3. Clique em **Reveal** e copie a chave
4. ⚠️ **NÃO COMPARTILHE ESSA CHAVE!**

#### 3.2. Ativar a extensão pg_cron (se necessário)

1. Dashboard > **Database** > **Extensions**
2. Procure por: **pg_cron**
3. Se não estiver ativado, clique em **Enable**

#### 3.3. Criar o Cron Job

**Dashboard > SQL Editor > New Query**

Cole o SQL abaixo, **SUBSTITUINDO** `<SERVICE_ROLE_KEY>` pela chave que você copiou:

```sql
SELECT cron.schedule(
    'process-notifications-hourly',
    '0 * * * *',
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

**Exemplo com chave real:**
```sql
SELECT cron.schedule(
    'process-notifications-hourly',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
```

Execute e deve retornar: **SUCCESS**

---

### ✅ PASSO 4: Verificar Configurações dos Templates

**Dashboard > SQL Editor > New Query**

```sql
SELECT 
    nt.notification_type,
    nt.is_active,
    nt.schedule_hour,
    LEFT(nt.message_template, 60) as mensagem
FROM notification_templates nt
JOIN companies c ON nt.company_id = c.id
WHERE c.name = 'SUA_EMPRESA'
ORDER BY nt.notification_type;
```

**Verificar:**
- ✅ `is_active` deve ser **true**
- ✅ `schedule_hour` deve ser um número entre **0-23** (não NULL)

**Se `schedule_hour` estiver NULL, execute:**
```sql
UPDATE notification_templates
SET schedule_hour = 9  -- 9h da manhã (ajuste conforme necessário)
WHERE schedule_hour IS NULL;
```

**Configuração recomendada de horários:**
- `expiration_7d`: 9h
- `expiration_5d`: 10h
- `expiration_3d`: 14h
- `expiration_2d`: 15h
- `expiration_today`: 10h

---

### ✅ PASSO 5: Verificar se as Notificações Estão Habilitadas

**Dashboard > SQL Editor > New Query**

```sql
SELECT 
    name,
    notifications_enabled
FROM companies;
```

Se `notifications_enabled = false`, execute:
```sql
UPDATE companies 
SET notifications_enabled = true;
```

---

### ✅ PASSO 6: Testar Manualmente AGORA

**Opção A: Via Interface**

1. Vá para: **Dashboard > WhatsApp > Conexão**
2. Role até a seção **Configurações de Notificações**
3. Clique no botão: **🔄 Processar Agora**
4. Aguarde alguns segundos
5. Vá para: **Histórico de Envios**
6. Verifique se apareceram novos envios

**Opção B: Via SQL**

**Dashboard > SQL Editor > New Query**

Cole e execute, **SUBSTITUINDO** `<SERVICE_ROLE_KEY>`:

```sql
SELECT net.http_post(
    url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
) AS request_id;
```

Depois verifique os logs:
```sql
SELECT 
    nl.sent_at,
    cl.name as cliente,
    nl.notification_type,
    t.cashback_value,
    nl.status,
    nl.error_message
FROM notification_log nl
JOIN clients cl ON nl.client_id = cl.id
JOIN transactions t ON nl.transaction_id = t.id
WHERE nl.sent_at > NOW() - INTERVAL '1 hour'
ORDER BY nl.sent_at DESC;
```

---

### ✅ PASSO 7: Verificar Transações Elegíveis

**Dashboard > SQL Editor > New Query**

```sql
SELECT 
    cl.name as cliente,
    cl.phone,
    t.cashback_value,
    t.cashback_expiration_date,
    EXTRACT(DAY FROM (t.cashback_expiration_date - CURRENT_DATE)) as dias_restantes
FROM transactions t
JOIN clients cl ON t.client_id = cl.id
WHERE t.cashback_redeemed = false
  AND t.cashback_expiration_date IS NOT NULL
  AND t.cashback_expiration_date >= CURRENT_DATE
ORDER BY t.cashback_expiration_date;
```

**Verificar:**
- ✅ Deve retornar transações com cashback pendente
- ✅ Cliente deve ter **telefone cadastrado**
- ✅ `dias_restantes` deve ser: 7, 5, 3, 2 ou 0 (para disparar notificação)

**Se não retornar nada:**
👉 Não há cashbacks elegíveis para notificar!

---

### ✅ PASSO 8: Verificar Logs da Edge Function

**Dashboard > Edge Functions > process-notifications > Logs**

Procure por erros como:
- ❌ `Evolution API error`: Problema com WhatsApp
- ❌ `Access denied`: Problema de autenticação
- ❌ `Cliente sem telefone`: Cliente sem telefone cadastrado

---

## 🎯 Checklist Final

Antes de aguardar a próxima execução automática, confirme:

- [ ] ✅ pg_cron está ativado
- [ ] ✅ Cron job existe e está `active = true`
- [ ] ✅ Templates estão com `is_active = true`
- [ ] ✅ Templates têm `schedule_hour` definido
- [ ] ✅ `notifications_enabled = true` na empresa
- [ ] ✅ Há transações elegíveis (cashback pendente)
- [ ] ✅ Clientes têm telefone cadastrado
- [ ] ✅ Teste manual funcionou

---

## 🕐 Como as Notificações Funcionam

### Horário de Disparo

O cron executa **a cada hora** (00:00, 01:00, 02:00, ..., 23:00).

**IMPORTANTE:** A notificação só é enviada se:
1. **Hoje** é um dos dias especiais (7, 5, 3, 2 dias antes ou dia do vencimento)
2. A **hora atual** coincide com o `schedule_hour` do template

### Exemplo Prático

**Cenário:**
- Hoje: 03/12/2025 às 14:00
- Cashback expira: 06/12/2025 (daqui a 3 dias)
- Template `expiration_3d` configurado para enviar às **14h**

**O que acontece:**
- ✅ 14:00 → Cron executa → Verifica que faltam 3 dias → Horário coincide (14h) → **ENVIA!**
- ❌ 15:00 → Cron executa → Verifica que ainda faltam 3 dias → Mas já foi enviado → **PULA**
- ❌ 16:00 → Cron executa → Verifica que ainda faltam 3 dias → Mas já foi enviado → **PULA**

---

## 🐛 Troubleshooting

### Problema: Teste manual funcionou, mas automático não

**Causa:** Provavelmente o cron job não está configurado.

**Solução:** Volte ao **PASSO 3** e crie o cron job.

---

### Problema: "Cliente sem telefone cadastrado"

**Causa:** Clientes na base não têm telefone.

**Solução:** Cadastre os telefones ou ignore esses clientes.

---

### Problema: Notificação não envia no horário configurado

**Causa:** Fuso horário do servidor diferente do seu.

**Solução:** Verifique o timezone:
```sql
SELECT NOW() as horario_servidor, EXTRACT(HOUR FROM NOW()) as hora_servidor;
```

Se necessário, ajuste os `schedule_hour` dos templates para compensar a diferença.

---

### Problema: "Evolution API error"

**Causa:** Problema na integração com WhatsApp.

**Solução:**
1. Verifique se a conexão WhatsApp está ativa
2. Teste um envio manual pela interface
3. Verifique as secrets da Edge Function:
   ```bash
   supabase secrets list
   ```

---

## 📞 Próximos Passos

Após executar todos os passos acima:

1. Aguarde até o **topo da próxima hora** (ex: se agora são 14:37, aguarde até 15:00)
2. Verifique se novas notificações aparecem no **Histórico de Envios**
3. Ou execute esta query para ver execuções do cron:

```sql
SELECT 
    runid,
    status,
    start_time,
    return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications-hourly')
ORDER BY start_time DESC
LIMIT 5;
```

---

## 📄 Arquivos de Apoio

Criados neste projeto para te ajudar:

- **diagnostico_notificacoes.sql**: Queries completas de diagnóstico
- **setup_cron_job.sql**: Script para criar o cron job
- **docs/NOTIFICACOES_AUTOMATICAS.md**: Documentação técnica completa
- **docs/edge_function_deploy_guide.md**: Guia de deploy da Edge Function

---

**Boa sorte! Se seguir todos os passos, as notificações automáticas vão funcionar! 🚀**
