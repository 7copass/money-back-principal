# ⏰ Como Configurar Horários dos Emails Automáticos

## 📧 Tipos de Emails e Seus Horários

| Tipo de Email | Quando Envia | Configurável? |
|---------------|--------------|---------------|
| Boas-vindas | Imediato (cadastro de cliente) | ❌ Não |
| Cashback recebido | Imediato (registro de cashback) | ❌ Não |
| Resgate confirmado | Imediato (resgate de cashback) | ❌ Não |
| **Alerta de expiração** | **Agendado (cron job)** | **✅ SIM** |

---

## 🎯 Email de Alerta de Expiração

### **O que é:**
Email automático enviado para clientes que têm cashback vencendo em **7 dias ou menos**.

### **Horário Padrão:**
- **6:00 AM** (Horário de Brasília)
- Schedule: `0 9 * * *` (9h UTC)

### **Frequência:**
- Todo dia automaticamente
- Não envia se não houver cashbacks expirando

---

## 🔧 Como Alterar o Horário

### **Passo 1: Acessar Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Database** → **SQL Editor**

### **Passo 2: Remover o Cron Job Atual**

```sql
SELECT cron.unschedule('notify-expiring-cashback-daily');
```

### **Passo 3: Criar com Novo Horário**

```sql
SELECT cron.schedule(
  'notify-expiring-cashback-daily',
  'NOVO_HORARIO_AQUI',  -- ← ALTERE AQUI!
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/notify-expiring-cashback',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**⚠️ Importante:** Substitua `SEU_PROJECT_ID` e `SUA_SERVICE_ROLE_KEY` pelos valores do seu projeto.

### **Passo 4: Confirmar Alteração**

```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'notify-expiring-cashback-daily';
```

---

## 🕐 Horários Disponíveis (Pré-configurados)

Substitua `'NOVO_HORARIO_AQUI'` por um destes:

### **Manhã:**

| Horário Brasil | Schedule UTC | Recomendação |
|----------------|--------------|--------------|
| 6:00 AM | `'0 9 * * *'` | ⭐ Padrão atual |
| 7:00 AM | `'0 10 * * *'` | Cedo |
| 8:00 AM | `'0 11 * * *'` | Início expediente |
| 9:00 AM | `'0 12 * * *'` | ⭐ Recomendado |
| 10:00 AM | `'0 13 * * *'` | Meio da manhã |
| 11:00 AM | `'0 14 * * *'` | Antes do almoço |

### **Tarde:**

| Horário Brasil | Schedule UTC | Recomendação |
|----------------|--------------|--------------|
| 12:00 PM | `'0 15 * * *'` | Horário de almoço |
| 14:00 PM | `'0 17 * * *'` | Início tarde |
| 16:00 PM | `'0 19 * * *'` | Meio da tarde |
| 18:00 PM | `'0 21 * * *'` | Final expediente |

### **Noite:**

| Horário Brasil | Schedule UTC | Recomendação |
|----------------|--------------|--------------|
| 20:00 PM | `'0 23 * * *'` | Noite |
| 22:00 PM | `'0 1 * * *'` | Tarde da noite |
| 00:00 AM | `'0 3 * * *'` | Meia-noite |

---

## 🧮 Calcular Horário Personalizado

### **Fórmula:**
```
Horário Brasil + 3 horas = Horário UTC
```

### **Formato do Schedule:**
```
'MINUTO HORA DIA_DO_MÊS MÊS DIA_DA_SEMANA'
```

**Componentes:**
- **MINUTO:** 0-59 (use `0` para hora exata)
- **HORA:** 0-23 (UTC)
- **DIA_DO_MÊS:** 1-31 ou `*` (todos)
- **MÊS:** 1-12 ou `*` (todos)
- **DIA_DA_SEMANA:** 0-6 (0=Domingo) ou `*` (todos)

### **Exemplos:**

| Descrição | Schedule |
|-----------|----------|
| Todo dia às 9h AM Brasil | `'0 12 * * *'` |
| Todo dia às 14h30 Brasil | `'30 17 * * *'` |
| Toda segunda às 9h Brasil | `'0 12 * * 1'` |
| Todo dia 1 do mês às 9h | `'0 12 1 * *'` |
| Dias úteis (seg-sex) às 9h | `'0 12 * * 1-5'` |
| A cada 2 horas | `'0 */2 * * *'` |

---

## 💡 Recomendações de Horário

### **✅ Melhor Horário: 9:00 AM**

**Por quê?**
- ✅ Cliente já está acordado e ativo
- ✅ Horário comercial (maior taxa de abertura)
- ✅ Cliente pode agir imediatamente
- ✅ Evita horários de pico de email (manhã cedo)

**Schedule:**
```sql
'0 12 * * *'  -- 9h AM Brasil
```

### **⚡ Segunda Opção: 8:00 AM**

**Por quê?**
- ✅ Cedo, mas não muito
- ✅ Cliente vê logo ao acordar
- ✅ Tem o dia todo para usar o cashback

**Schedule:**
```sql
'0 11 * * *'  -- 8h AM Brasil
```

### **❌ Evitar:**
- **Madrugada** (00h-5h) → Cliente dormindo
- **Horário de almoço** (12h-14h) → Cliente ocupado
- **Noite** (20h+) → Baixa taxa de leitura

---

## 🧪 Testar Novo Horário

Depois de alterar, você pode testar **imediatamente** sem esperar:

### **Via Terminal:**
```bash
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/notify-expiring-cashback' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY'
```

### **Via SQL:**
```sql
SELECT net.http_post(
  url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/notify-expiring-cashback',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

**Deve retornar:**
```json
{
  "success": true,
  "totalNotifications": X,
  "totalErrors": 0
}
```

---

## 📊 Verificar Execuções

### **Ver Histórico:**
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'notify-expiring-cashback-daily')
ORDER BY start_time DESC
LIMIT 10;
```

### **Ver Próxima Execução:**
```sql
SELECT 
  jobname,
  schedule,
  active,
  -- Calcular próxima execução (aproximado)
  CASE 
    WHEN schedule = '0 9 * * *' THEN 'Todo dia às 6h AM (Brasil)'
    WHEN schedule = '0 12 * * *' THEN 'Todo dia às 9h AM (Brasil)'
    ELSE schedule
  END as descricao
FROM cron.job 
WHERE jobname = 'notify-expiring-cashback-daily';
```

---

## 🔍 Troubleshooting

### **❌ Cron não está rodando**

**Verificar se existe:**
```sql
SELECT * FROM cron.job WHERE jobname = 'notify-expiring-cashback-daily';
```

**Se não aparecer:** Criar novamente usando Passo 3.

### **❌ Cron existe mas falha**

**Ver erros:**
```sql
SELECT status, return_message 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'notify-expiring-cashback-daily')
ORDER BY start_time DESC
LIMIT 1;
```

**Erros comuns:**
- `schema "net" does not exist` → Executar: `CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;`
- `404 Not Found` → Verificar URL da edge function
- `401 Unauthorized` → Verificar service_role_key

### **❌ Emails não chegam**

1. **Verificar SendGrid:** https://app.sendgrid.com/statistics
2. **Ver logs da edge function:** Supabase Dashboard → Edge Functions → Logs
3. **Testar manualmente** usando comando curl acima

---

## 📝 Exemplo Completo: Mudar para 9h AM

### **Passo a passo completo:**

```sql
-- 1. Remover cron atual
SELECT cron.unschedule('notify-expiring-cashback-daily');

-- 2. Criar com 9h AM Brasil (12h UTC)
SELECT cron.schedule(
  'notify-expiring-cashback-daily',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyMTE2MiwiZXhwIjoyMDc4OTk3MTYyfQ.t-t11_yUMIaPcaCQB0yRNw_Ol06nhDOi6PburF0T9Wc'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. Confirmar
SELECT jobname, schedule, active FROM cron.job 
WHERE jobname = 'notify-expiring-cashback-daily';

-- 4. Testar imediatamente (opcional)
SELECT net.http_post(
  url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyMTE2MiwiZXhwIjoyMDc4OTk3MTYyfQ.t-t11_yUMIaPcaCQB0yRNw_Ol06nhDOi6PburF0T9Wc'
  ),
  body := '{}'::jsonb
);
```

✅ **Pronto! Agora vai rodar todo dia às 9h AM!**

---

## 📚 Recursos Adicionais

- **Documentação do pg_cron:** https://github.com/citusdata/pg_cron
- **Crontab Guru (validador):** https://crontab.guru
- **SendGrid Dashboard:** https://app.sendgrid.com
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Atualizado em:** 05/12/2025  
**Versão:** 1.0.0
