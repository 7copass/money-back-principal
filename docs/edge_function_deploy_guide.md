# 🚀 Guia: Deploy da Edge Function de Notificações Automáticas

## 📋 Pré-requisitos

- Conta no Supabase
- Projeto Supabase já criado
- Node.js instalado
- Terminal/Command Line

---

## 📦 Passo 1: Instalar o Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via npm)
npm install -g supabase

# Verificar instalação
supabase --version
```

---

## 🔐 Passo 2: Login no Supabase

```bash
supabase login
```

Isso vai abrir seu navegador para autenticar. Confirme o login.

---

## 🔗 Passo 3: Linkar com seu Projeto

```bash
cd /Users/victorhugosantanaalmeida/Downloads/moneyback---cashback-platform

supabase link --project-ref SEU_PROJECT_REF
```

**Como encontrar o `PROJECT_REF`:**
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID**

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente (Secrets)

Você precisa adicionar as credenciais da Evolution API como secrets:

```bash
# URL da Evolution API
supabase secrets set EVOLUTION_API_URL=https://sua-evolution-api.com

# API Key da Evolution
supabase secrets set EVOLUTION_API_KEY=sua-chave-aqui
```

**IMPORTANTE:** Substitua pelos valores reais da sua Evolution API.

---

## 🚀 Passo 5: Deploy da Função

```bash
supabase functions deploy process-notifications
```

Aguarde o deploy terminar. Você verá uma mensagem de sucesso com a URL da função.

---

## ⏰ Passo 6: Configurar Cron Job (Executar de Hora em Hora)

### 6.1. Ativar extensão pg_cron

No Supabase Dashboard:

1. Acesse seu projeto em [app.supabase.com](https://app.supabase.com)
2. Vá em **Database** → **Extensions**
3. Ative a extensão **pg_cron** (procure por "pg_cron" e clique em "Enable")

### 6.2. Pegar sua Service Role Key

1. No Supabase Dashboard
2. **Settings** → **API**
3. Copie a **service_role** key (⚠️ **NÃO** a anon key!)

### 6.3. Criar o Cron Job

Execute este SQL no **SQL Editor**, substituindo os valores:

```sql
-- Criar job que roda de hora em hora
SELECT cron.schedule(
  'process-notifications-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY_AQUI'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

⚠️ **IMPORTANTE:** 
- Substitua `SUA_SERVICE_ROLE_KEY_AQUI` pela service_role key que você copiou
- A URL já está com seu project ref: `phznyksqgtanfqcphvod`

---

## ✅ Passo 7: Testar Manualmente

Teste se a função está funcionando antes do cron:

```bash
supabase functions invoke process-notifications --no-verify-jwt
```

Ou pela URL diretamente:

```bash
curl -X POST \
  'https://phznyksqgtanfqcphvod.supabase.co/functions/v1/process-notifications' \
  -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## 📊 Passo 8: Monitorar Logs

Ver logs em tempo real:

```bash
supabase functions logs process-notifications
```

Ou no Dashboard:
1. **Edge Functions** → **process-notifications**
2. Clique em **Logs**

---

## 🔍 Verificar se o Cron Está Funcionando

No **SQL Editor**, execute:

```sql
-- Ver jobs agendados
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎉 Pronto!

Agora as notificações serão processadas **automaticamente de hora em hora**, independente de alguém estar logado!

### O que acontece agora:

- ⏰ **A cada hora**: O cron chama a Edge Function
- 🏢 **Para cada empresa**: Processa notificações pendentes
- 📱 **Envia WhatsApp**: Se estiver no horário configurado do template
- 📝 **Registra log**: Salva todas as tentativas de envio

---

## 🛠️ Comandos Úteis

```bash
# Ver todas as funções
supabase functions list

# Ver secrets configurados
supabase secrets list

# Deletar um secret
supabase secrets unset NOME_DO_SECRET

# Deletar a função
supabase functions delete process-notifications
```

---

## ⚠️ Troubleshooting

### Função não executa?
- Verifique se pg_cron está ativado
- Confira se a service_role_key está configurada corretamente
- Veja os logs do cron: `SELECT * FROM cron.job_run_details`

### Notificações não são enviadas?
- Verifique os secrets (EVOLUTION_API_URL e EVOLUTION_API_KEY)
- Teste a função manualmente
- Olhe os logs: `supabase functions logs process-notifications`

### Erros de autenticação?
- Confirme que está usando a **service_role** key, não a anon key
- Reconfigurar: `ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'nova_key';`

---

## 📈 Próximos Passos

Agora você pode:
- ✅ Remover o scheduler do frontend (App.tsx)
- ✅ Remover o botão "Processar Agora" (opcional)
- ✅ Monitorar o histórico de envios na aba criada
