# 🚀 Deploy da Correção - Notificações Automáticas

## ✅ O Que Foi Corrigido

A Edge Function `process-notifications` estava tentando usar a coluna `cashback_redeemed` que **não existe** no banco de dados.

**Corrigi para usar:** `status = 'Disponível'`

Agora precisa fazer o **deploy** dessa correção no Supabase.

---

## 📋 Opções de Deploy

Você tem **2 opções**:

---

## 🎯 OPÇÃO 1: Deploy Manual (Recomendado - Mais Simples)

Sem precisar de CLI! Copie e cole o código corrigido diretamente no Supabase Dashboard.

### Passos:

1. **Acesse:** https://app.supabase.com
2. Vá em: **Edge Functions** (menu lateral)
3. Clique em: **process-notifications**
4. Clique no botão: **Edit function** (ou ✏️)
5. **Substitua TODO o conteúdo** pelo arquivo corrigido: `supabase/functions/process-notifications/index.ts`
6. Clique em: **Save** ou **Deploy**

Pronto! A correção está no ar! ✅

---

## 🖥️ OPÇÃO 2: Deploy via CLI (Mais Técnico)

### Passo 1: Fazer Login

**Abra o terminal** e execute:

```bash
cd /Users/victorhugosantanaalmeida/Downloads/moneyback---cashback-platform
supabase login
```

- Isso vai abrir o navegador
- Copie o código de verificação
- Cole no terminal
- Confirme o login

### Passo 2: Linkar com o Projeto

```bash
supabase link --project-ref phznyksqgtanfqcphvod
```

- Vai pedir a senha do banco de dados
- Se não souber, pule para a **OPÇÃO 1**

### Passo 3: Deploy

```bash
supabase functions deploy process-notifications
```

Pronto! ✅

---

## 🧪 Como Testar Se Funcionou

### Teste 1: Via SQL (Mais Fácil)

**Dashboard > SQL Editor > New Query**

```sql
-- Ver transações elegíveis para notificação
SELECT 
    cl.name as cliente,
    cl.phone,
    t.cashback_value,
    t.cashback_expiration_date,
    t.status,
    EXTRACT(DAY FROM (t.cashback_expiration_date - CURRENT_DATE)) as dias_restantes
FROM transactions t
JOIN clients cl ON t.client_id = cl.id
WHERE t.status = 'Disponível'
  AND t.cashback_expiration_date IS NOT NULL
  AND t.cashback_expiration_date >= CURRENT_DATE
ORDER BY t.cashback_expiration_date
LIMIT 10;
```

**O que você deve ver:**
- Lista de clientes com cashback disponível
- Quantos dias faltam para vencer
- Status "Disponível"

Se aparecer dados = Há transações para notificar! ✅

---

### Teste 2: Processar Manualmente

**No seu aplicativo web:**

1. Dashboard → **WhatsApp** → **Conexão**
2. Role até: **Configurações de Notificações**
3. Clique em: **🔄 Processar Agora**
4. Aguarde alguns segundos
5. Vá para: **Histórico de Envios**

**O que você deve ver:**
- Novas notificações aparecendo no histórico
- Status: "sent" (sucesso) ou "failed" (com erro explicativo)

---

### Teste 3: Via SQL (Manual)

**Dashboard > SQL Editor > New Query**

Substitua `<SERVICE_ROLE_KEY>` pela sua chave (Settings > API > service_role):

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

Execute e depois veja os logs:

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
WHERE nl.sent_at > NOW() - INTERVAL '10 minutes'
ORDER BY nl.sent_at DESC;
```

---

## 📊 Ver Logs da Edge Function

**Dashboard > Edge Functions > process-notifications > Logs**

Procure por:
- ✅ `[CRON] Starting notification processing...`
- ✅ `[CRON] Company X: Y sent, Z errors`
- ✅ `[CRON] Finished: ...`

Se aparecer erros:
- `ERROR 42703: column "cashback_redeemed" does not exist` = Deploy não foi feito ainda
- `Evolution API error: ...` = Problema com WhatsApp
- `Cliente sem telefone cadastrado` = Cliente precisa ter telefone

---

## 🎯 Checklist Final

Antes de considerar resolvido:

- [ ] ✅ Deploy da Edge Function feito (Opção 1 ou 2)
- [ ] ✅ Teste SQL retorna transações com status "Disponível"
- [ ] ✅ Teste manual ("Processar Agora") funciona
- [ ] ✅ Aparece no "Histórico de Envios"
- [ ] ✅ Logs da Edge Function sem erro de coluna

---

## ⏰ Quando as Notificações Vão Disparar Automaticamente

O cron executa **a cada hora** (00:00, 01:00, 02:00, ..., 23:00).

**Para uma notificação ser enviada, precisa:**

1. **Transação com status "Disponível"** ✅
2. **Data de vencimento em:** 7, 5, 3, 2 dias OU hoje ✅
3. **Hora atual = schedule_hour do template** ✅
4. **Não ter sido enviada antes** ✅

**Exemplo:**
- Hoje: 03/12/2025 às 20:00
- Cashback expira: 06/12/2025 (daqui a 3 dias)
- Template `expiration_3d` configurado para horário **9h**
- Resultado: ⏳ **Vai enviar amanhã às 9h** (quando o cron rodar às 9h)

---

## 🆘 Ainda Não Funcionou?

Se após o deploy continuar com problemas:

1. **Veja os logs da Edge Function** (procure por erros)
2. **Execute o diagnóstico completo:** arquivo `diagnostico_notificacoes.sql`
3. **Me avise** com a mensagem de erro exata

---

## 🎉 Sucesso!

Se tudo funcionou:
- ✅ Edge Function corrigida e no ar
- ✅ Notificações sendo enviadas
- ✅ Sistema rodando automaticamente 24/7

**As notificações agora vão funcionar automaticamente!** 🚀

---

**Última atualização:** 03/12/2025
