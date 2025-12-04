# 💰 Moneyback - Plataforma de Cashback e Fidelização

Plataforma completa e moderna para gestão de cashback, fidelização de clientes e automação de marketing via WhatsApp. Desenvolvida para maximizar a retenção de clientes e aumentar o LTV (Lifetime Value).

![Moneyback Dashboard](https://placehold.co/1200x600/png?text=Dashboard+Preview)

## 🚀 Funcionalidades Principais

### 📊 Dashboards Inteligentes
- **Visão Geral em Tempo Real**: Acompanhe MRR, ARR, Clientes Ativos e Total de Cashback Distribuído.
- **Gráficos Interativos**: Evolução de vendas, cadastros e resgates.
- **Rankings**: Identifique seus melhores clientes e empresas parceiras.

### 👥 Gestão de Clientes (CRM)
- **Perfil Completo**: Histórico de compras, saldo de cashback e interações.
- **Segmentação RFM**: Análise de Recência, Frequência e Valor Monetário.
- **Análise ABC**: Classificação de clientes por importância no faturamento.

### 💳 Transações e Produtos
- **Registro Ágil**: Vendas com cálculo automático de cashback.
- **Catálogo de Produtos**: Gestão de produtos e serviços com preços padronizados.
- **Múltiplos Itens**: Suporte a carrinhos com diversos produtos.

### 🔔 Automação de Marketing (WhatsApp)
Sistema robusto de notificações automáticas para recuperar clientes antes que o cashback expire.
- **Agendamento Preciso**: Configure a **Hora e Minuto** exatos para o envio das mensagens.
- **Fuso Horário Inteligente**: Ajuste automático para o horário do Brasil (UTC-3).
- **Ciclo de Vida**: Envios automáticos 7, 5, 3, 2 dias antes e no dia do vencimento.
- **Templates Personalizáveis**: Crie mensagens dinâmicas com variáveis (Nome, Valor, Data).
- **Histórico Detalhado**: Log completo de envios com status (Enviado/Falha).

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **UI/UX**: Lucide Icons, React Hot Toast (Notificações), Glassmorphism design.
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Realtime).
- **Serverless**: Supabase Edge Functions (Deno) para automação.
- **Integração**: Evolution API (WhatsApp Gateway).

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Instância da Evolution API (para WhatsApp)

### 1. Clone e Instale
```bash
git clone https://github.com/seu-usuario/moneyback-platform.git
cd moneyback-platform
npm install
```

### 2. Configuração de Ambiente
Copie o arquivo de exemplo e preencha com suas credenciais:
```bash
cp .env.example .env.local
```
Edite `.env.local` e adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EVOLUTION_API_URL`
- `VITE_EVOLUTION_API_KEY`

### 3. Banco de Dados (Supabase)
Execute os scripts SQL disponíveis na pasta raiz para criar a estrutura do banco:
1. `database_setup.sql` (Tabelas base: companies, clients, transactions)
2. `create_products_table.sql` (Tabela de produtos)
3. `create_notification_tables.sql` (Logs e templates)
4. `add_notification_schedule_minute.sql` (Suporte a agendamento por minuto)

### 4. Rodando Localmente
```bash
npm run dev
```
Acesse `http://localhost:5173`.

---

## 🤖 Configurando a Automação (Edge Functions)

Para que as notificações sejam enviadas automaticamente, você precisa fazer o deploy da Edge Function e configurar o Cron Job.

### 1. Deploy da Função
Certifique-se de ter o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado.

```bash
npx supabase functions deploy process-notifications
```

### 2. Configurar Variáveis de Ambiente (Supabase)
No painel do Supabase, vá em **Edge Functions** -> **process-notifications** -> **Manage Secrets** e adicione:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`

### 3. Configurar o Agendamento (Cron Job)
No **SQL Editor** do Supabase, execute:

```sql
select
  cron.schedule(
    'process-notifications-job',
    '*/10 * * * *', -- Executa a cada 10 minutos
    $$
    select
      net.http_post(
          url:='https://<SEU-PROJETO>.supabase.co/functions/v1/process-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SUA-SERVICE-KEY>"}'::jsonb
      ) as request_id;
    $$
  );
```

---

## 📚 Documentação Adicional

- **[Guia de Notificações](./docs/NOTIFICACOES_AUTOMATICAS.md)**: Detalhes sobre a lógica de envio e templates.
- **[Deploy Guide](./docs/edge_function_deploy_guide.md)**: Passo a passo detalhado para deploy da função serverless.

---

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a Branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

**Moneyback** © 2025 - Todos os direitos reservados.
