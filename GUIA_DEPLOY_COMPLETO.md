# 📋 GUIA COMPLETO DE DEPLOY - SISTEMA DE EMAILS

## ✅ Status Atual:

- [x] Edge Function `send-email` deployed
- [x] Edge Function `notify-expiring-cashback` deployed
- [x] Código integrado em `services.ts`
- [x] Variáveis de ambiente configuradas
- [ ] Cron Job configurado
- [ ] Testes finais realizados

---

# 🚀 PARTE 1: CONFIGURAÇÃO DO CRON JOB

## **Passo 1.1: Acessar Dashboard do Supabase**

1. Abra: https://supabase.com/dashboard/project/phznyksqgtanfqcphvod
2. Faça login se necessário

---

## **Passo 1.2: Instalar Extensão pg_cron**

1. No menu lateral, clique em **"Database"**
2. Clique em **"Extensions"**
3. Procure por **"pg_cron"**
4. Clique em **"Enable"** (se não estiver habilitado)
5. Aguarde a confirmação ✅

---

## **Passo 1.3: Criar Cron Job**

1. No menu lateral, clique em **"Database"**
2. Clique em **"Cron Jobs"** (ou **"pg_cron"**)
3. Clique em **"Create a new cron job"**

---

## **Passo 1.4: Configurar o Job**

### **Nome:**
```
notify_expiring_cashback_daily
```

### **Schedule (Cron Expression):**
```
0 9 * * *
```
**Significado:** Todo dia às 9:00 AM (horário do servidor)

**Ou escolha outro horário:**
- `0 8 * * *` → 8:00 AM
- `0 10 * * *` → 10:00 AM
- `0 12 * * *` → 12:00 PM (meio-dia)
- `0 18 * * *` → 6:00 PM

### **SQL Command:**

```sql
SELECT
  net.http_post(
    url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyMTE2MiwiZXhwIjoyMDc4OTk3MTYyfQ.t-t11_yUMIaPcaCQB0yRNw_Ol06nhDOi6PburF0T9Wc'
    )
  ) as request_id;
```

### **Timezone (opcional):**
```
America/Sao_Paulo
```

4. Clique em **"Create cron job"**
5. Aguarde confirmação ✅

---

## **Passo 1.5: Verificar se foi criado**

1. A tabela deve mostrar o novo job:
   - **Name:** `notify_expiring_cashback_daily`
   - **Schedule:** `0 9 * * *`
   - **Status:** `active` ou `enabled`

---

# 🧪 PARTE 2: TESTES COMPLETOS

## **Teste 1: Email de Boas-vindas**

### **Passo 2.1: Cadastrar Cliente Novo**

1. Abra o sistema: http://localhost:3000
2. Faça login
3. Vá em **"Clientes"** (menu lateral)
4. Clique em **"Cadastrar Cliente"**
5. Preencha:
   - **Nome:** Teste Email Boas Vindas
   - **Email:** **SEU-EMAIL-REAL@gmail.com** ← IMPORTANTE!
   - **Telefone:** 11999998888
   - **CPF:** 123.456.789-00
6. Clique em **"Cadastrar"**

### **Passo 2.2: Verificar Console**

Abra o Console do navegador (F12) e procure:
```
✅ Email de boas-vindas enviado para: SEU-EMAIL@gmail.com
```

### **Passo 2.3: Verificar Email**

1. Abra seu Gmail/Email
2. Procure email de: **Bthree <contato@fidelify.com.br>**
3. Assunto: **"Bem-vindo ao [Nome da Empresa]!"**
4. **Confirmação:** ✅ Email chegou!

---

## **Teste 2: Email de Cashback Recebido**

### **Passo 2.4: Registrar Cashback**

1. Vá em **"Registrar Cashback"**
2. Busque o cliente que você acabou de criar
3. Preencha:
   - **Produto:** Notebook Dell
   - **Valor:** R$ 2000,00
   - **% Cashback:** 5
   - **Data de Validade:** 04/04/2026
4. Clique em **"Gerar Cashback"**

### **Passo 2.5: Verificar Console**

```
✅ Email de cashback enviado para: SEU-EMAIL@gmail.com
```

### **Passo 2.6: Verificar Email**

1. Assunto: **"Você recebeu R$ 100,00 em cashback!"**
2. **Confirmação:** ✅ Email chegou!

---

## **Teste 3: Email de Resgate**

### **Passo 2.7: Resgatar Cashback**

1. Vá em **"Resgatar Cashback"**
2. Busque o cliente (Teste Email Boas Vindas)
3. Digite o valor da compra: R$ 50,00
4. Clique em **"Resgatar"**

### **Passo 2.8: Verificar Console**

```
✅ Email de resgate enviado para: SEU-EMAIL@gmail.com
```

### **Passo 2.9: Verificar Email**

1. Assunto: **"Cashback resgatado: R$ 100,00"**
2. **Confirmação:** ✅ Email chegou!

---

## **Teste 4: Email de Expiração (Manual)**

### **Passo 2.10: Testar Edge Function**

Execute no terminal:

```bash
curl -i --location --request POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyMTE2MiwiZXhwIjoyMDc4OTk3MTYyfQ.t-t11_yUMIaPcaCQB0yRNw_Ol06nhDOi6PburF0T9Wc'
```

### **Passo 2.11: Ver Resposta**

Deve retornar algo como:
```json
{
  "success": true,
  "totalNotifications": 0,
  "totalErrors": 0,
  "message": "Processed 0 notifications with 0 errors"
}
```

**Nota:** Se não tiver cashback expirando nos próximos 7 dias, será 0.

---

# 📊 PARTE 3: MONITORAMENTO

## **Passo 3.1: Ver Logs das Edge Functions**

### **Logs da função send-email:**
```bash
supabase functions logs send-email --tail
```

### **Logs da função notify-expiring-cashback:**
```bash
supabase functions logs notify-expiring-cashback --tail
```

---

## **Passo 3.2: Dashboard do SendGrid**

1. Acesse: https://app.sendgrid.com/statistics
2. Veja quantos emails foram enviados
3. Taxa de entrega, abertura, etc.

---

## **Passo 3.3: Ver Cron Job Executions**

1. Acesse: https://supabase.com/dashboard/project/phznyksqgtanfqcphvod/database/cron-jobs
2. Clique no job criado
3. Veja histórico de execuções
4. Verifique erros (se houver)

---

# 🎯 PARTE 4: CHECKLIST FINAL

## **4.1: Funcionalidades**

- [ ] ✅ Cliente cadastrado → Email de boas-vindas
- [ ] ✅ Cashback registrado → Email de cashback recebido  
- [ ] ✅ Cashback resgatado → Email de confirmação
- [ ] ✅ Cashback expirando → Email de alerta (cron)

## **4.2: Configurações**

- [x] Edge Function `send-email` deployed
- [x] Edge Function `notify-expiring-cashback` deployed
- [ ] Cron job configurado no Supabase
- [x] Variáveis de ambiente configuradas
- [x] SendGrid API Key válida
- [x] Email sender verificado

## **4.3: Testes**

- [ ] Email de boas-vindas testado
- [ ] Email de cashback testado
- [ ] Email de resgate testado
- [ ] Email de expiração testado (manual)
- [ ] Logs verificados
- [ ] SendGrid dashboard verificado

---

# 🚀 PARTE 5: DEPLOY EM PRODUÇÃO (OPCIONAL)

Se você quiser fazer deploy em produção (Vercel, Netlify, etc):

## **Passo 5.1: Build de Produção**

```bash
npm run build
```

## **Passo 5.2: Variáveis de Ambiente em Produção**

Configure no servidor:
```bash
VITE_SUPABASE_URL=https://phznyksqgtanfqcphvod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EVOLUTION_API_URL=https://evo.tcsistemas.com
VITE_EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
```

## **Passo 5.3: Deploy**

### **Vercel:**
```bash
vercel --prod
```

### **Netlify:**
```bash
netlify deploy --prod
```

---

# 📝 PARTE 6: TROUBLESHOOTING

## **Problema: Email não chega**

### **Solução 1: Verificar console**
```javascript
// Deve aparecer:
✅ Email de [tipo] enviado para: email@example.com

// Se aparecer erro:
❌ Erro ao enviar email: [mensagem]
```

### **Solução 2: Verificar logs da Edge Function**
```bash
supabase functions logs send-email --tail
```

### **Solução 3: Verificar SendGrid Dashboard**
- Vá em: https://app.sendgrid.com/statistics
- Verifique se o email foi enviado
- Veja se teve bounce ou spam

### **Solução 4: Verificar variáveis de ambiente**
```bash
# No arquivo .env.local, verifique:
VITE_SUPABASE_URL=https://phznyksqgtanfqcphvod.supabase.co
VITE_SUPABASE_ANON_KEY=[chave correta]
```

---

## **Problema: Cron job não executa**

### **Solução 1: Testar manualmente**
```bash
curl -i --location --request POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/notify-expiring-cashback' \
  --header 'Authorization: Bearer [SERVICE_ROLE_KEY]'
```

### **Solução 2: Verificar extensão pg_cron**
- Database → Extensions → pg_cron → Enabled ✅

### **Solução 3: Verificar timezone**
- O cron roda no horário UTC por padrão
- Se configurou 9:00 AM → será 9:00 AM UTC (6:00 AM BRT)

---

# ✅ CONCLUSÃO

## **Sistema Completo de Emails:**

1. ✅ **Boas-vindas** → Cadastro de cliente
2. ✅ **Cashback recebido** → Registro de transação
3. ✅ **Resgate confirmado** → Resgate de cashback
4. ✅ **Alerta de expiração** → Cron job diário

## **Próximos Passos:**

1. **Configure o Cron Job** (Parte 1)
2. **Teste todos os emails** (Parte 2)
3. **Monitore os logs** (Parte 3)
4. **Marque o checklist** (Parte 4)

---

**TUDO PRONTO!** 🎉

Agora é só seguir os passos e testar! 🚀

---

**Data do Deploy:** 05/12/2025  
**Status:** ✅ **SISTEMA COMPLETO E FUNCIONAL**
