# 🚀 Como Configurar Email de Cashback Expirando

## ✅ O que foi implementado:

### 1. **Email de Boas-vindas** ✅
- Enviado quando um cliente é cadastrado
- Integrado em `api.addClient()`

### 2. **Email de Resgate** ✅
- Enviado quando cliente resgata cashback
- Integrado em `api.redeemCashback()`

### 3. **Email de Expiração** 📅
- Enviado quando cashback está próximo de vencer
- Requer Edge Function + Cron Job

---

## 📋 Deploy da Edge Function de Expiração

### **Passo 1: Deploy da função**

```bash
supabase functions deploy notify-expiring-cashback
```

### **Passo 2: Testar manualmente**

```bash
curl -i --location --request POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback' \
  --header 'Authorization: Bearer SEU_SERVICE_ROLE_KEY'
```

---

## ⏰ Configurar Cron Job (Execução Automática)

### **Opção 1: Supabase Cron (Recomendado)**

1. Acesse: https://supabase.com/dashboard/project/phznyksqgtanfqcphvod/database/cron-jobs

2. Clique em "Create a cron job"

3. Configure:
   - **Name**: `notify_expiring_cashback`
   - **Schedule**: `0 9 * * *` (todo dia às 9h)
   - **Function to run**:
     ```sql
     SELECT
       net.http_post(
         url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
         )
       ) as request_id;
     ```

4. Clique em "Create cron job"

---

### **Opção 2: Cron Manual (GitHub Actions)**

Criar arquivo `.github/workflows/notify-expiring.yml`:

```yaml
name: Notify Expiring Cashback

on:
  schedule:
    - cron: '0 9 * * *'  # Todo dia às 9h UTC
  workflow_dispatch:  # Permite execução manual

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

---

## 🧪 Testar AGORA

### **1. Teste Email de Boas-vindas**

```bash
# No navegador:
# 1. Vá em "Clientes"
# 2. Clique em "Cadastrar Cliente"
# 3. Preencha os dados COM SEU EMAIL
# 4. Clique em "Cadastrar"
# 5. Verifique seu email! 📧
```

### **2. Teste Email de Resgate**

```bash
# No navegador:
# 1. Vá em "Resgatar Cashback"
# 2. Busque o cliente
# 3. Clique em "Resgatar"
# 4. Verifique seu email! 📧
```

### **3. Teste Email de Expiração**

```bash
# Via curl (manual):
curl -i --location --request POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyMTE2MiwiZXhwIjoyMDc4OTk3MTYyfQ.t-t11_yUMIaPcaCQB0yRNw_Ol06nhDOi6PburF0T9Wc'
```

---

## 📊 Monitorar Emails de Expiração

### Ver logs:
```bash
supabase functions logs notify-expiring-cashback --tail
```

### Ver quantos foram enviados:
```bash
supabase functions logs notify-expiring-cashback | grep "Email expiring sent"
```

---

## ✅ Checklist Final

- [x] Email de boas-vindas integrado
- [x] Email de cashback recebido integrado
- [x] Email de resgate integrado
- [ ] Edge Function de expiração deployed
- [ ] Cron job configurado
- [ ] Teste de boas-vindas realizado
- [ ] Teste de resgate realizado
- [ ] Teste de expiração realizado

---

## 🎯 Próximos Passos

1. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy notify-expiring-cashback
   ```

2. **Configurar Cron Job** no Supabase Dashboard

3. **Testar tudo:**
   - Cadastrar cliente novo → Email de boas-vindas
   - Registrar cashback → Email de cashback
   - Resgatar cashback → Email de resgate
   - Rodar função manual → Email de expiração

---

**Todos os emails estão prontos!** 🎉

Execute o deploy e configure o cron job para finalizar! 🚀
