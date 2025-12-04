# Como Fazer Deploy da Função de Notificações

Você tem duas opções principais para atualizar a função no Supabase. Como você já tem o **Supabase CLI** instalado, a Opção 1 é a mais rápida e recomendada.

## Opção 1: Via Terminal (Recomendado)

Como você já tem o CLI instalado, basta rodar o seguinte comando no terminal do seu projeto:

```bash
npx supabase functions deploy process-notifications
```
*Nota: Se pedir senha, é a sua senha de banco de dados do Supabase ou token de acesso.*

Se você não estiver logado, rode antes:
```bash
npx supabase login
```

## Opção 2: Via Interface do Supabase (Dashboard)

Atualmente, o Supabase **não permite editar o código das Edge Functions diretamente no navegador** (diferente das Database Functions em SQL). Você precisa fazer o deploy do código local para a nuvem.

No entanto, você pode verificar se o deploy funcionou:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá para o menu lateral **Edge Functions**.
3. Clique na função `process-notifications`.
4. Na aba **Invocations** ou **Logs**, você poderá ver quando ela for executada.
5. Na aba **Details**, você vê a versão atual e quando foi feito o último deploy.

## Configuração do Agendamento (CRON)

Para que a função rode automaticamente a cada hora (ou minuto), você precisa configurar o CRON.

1. No seu projeto, verifique se o arquivo `supabase/config.toml` (se existir) tem a configuração de cron.
2. **OU** (Mais fácil) Configure via SQL no Dashboard:

Vá em **SQL Editor** no Supabase e execute:

```sql
-- Habilitar a extensão pg_cron se ainda não estiver
create extension if not exists pg_cron;

-- Agendar a função para rodar a cada 10 minutos (ou o intervalo que preferir)
-- Ajuste a URL para a URL da sua função (você pega no Dashboard em Edge Functions)
select
  cron.schedule(
    'process-notifications-job', -- nome do job
    '*/10 * * * *',              -- a cada 10 minutos
    $$
    select
      net.http_post(
          url:='https://<SUA_URL_DO_PROJETO>.supabase.co/functions/v1/process-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SUA_SERVICE_ROLE_KEY>"}'::jsonb
      ) as request_id;
    $$
  );
```

*Atenção: Você precisa substituir `<SUA_URL_DO_PROJETO>` e `<SUA_SERVICE_ROLE_KEY>` pelos valores reais do seu projeto.*

## Resumo do Código Atualizado

O código que preparamos em `supabase/functions/process-notifications/index.ts` agora:
1. Lê as configurações de hora **E minuto** da tabela `companies`.
2. Converte o horário UTC do servidor para **Horário de Brasília (UTC-3)**.
3. Tem uma tolerância de 5 minutos para garantir que a execução do CRON pegue o horário agendado.
