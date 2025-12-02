# 💰 Moneyback - Plataforma de Cashback

Plataforma completa para gestão de cashback, fidelização de clientes e automação de notificações via WhatsApp.

## 🚀 Funcionalidades Principais

### 📊 Dashboards
- **Visão Geral**: Métricas em tempo real (MRR, ARR, Clientes Ativos).
- **Gráficos**: Evolução de vendas e cadastros.
- **Rankings**: Top clientes e empresas.

### 👥 Gestão de Clientes
- Cadastro completo de clientes.
- Histórico de transações e cashbacks.
- Segmentação por atividade.

### 💳 Transações e Produtos
- Registro de vendas com cálculo automático de cashback.
- **Gestão de Produtos**: Cadastro de produtos/serviços com valores padrão.
- Suporte a múltiplos produtos por transação.

### 📱 Notificações Automáticas (WhatsApp)
Sistema robusto de lembretes automáticos para vencimento de cashback.
- **Totalmente Automático**: Roda 24/7 via Supabase Edge Functions.
- **Personalizável**: Templates configuráveis por empresa.
- **Cronograma Inteligente**: Envios 7, 5, 3, 2 dias antes e no dia do vencimento.
- **Histórico Completo**: Log detalhado de todos os envios.

---

## 🛠️ Tecnologias

- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime).
- **Serverless**: Supabase Edge Functions (Deno).
- **Integração**: Evolution API (WhatsApp).

---

## 📚 Documentação Técnica

Documentação detalhada disponível na pasta [`docs/`](./docs/):

- **[📱 Sistema de Notificações](./docs/NOTIFICACOES_AUTOMATICAS.md)**: Arquitetura e funcionamento detalhado.
- **[🚀 Guia de Deploy (Edge Function)](./docs/edge_function_deploy_guide.md)**: Como configurar a automação.

---

## ⚙️ Configuração do Projeto

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### 1. Instalação (Frontend)

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Adicione suas chaves do Supabase e Evolution API
```

### 2. Executar Localmente

```bash
npm run dev
```

### 3. Configuração do Banco de Dados

Execute os scripts SQL na pasta raiz para criar as tabelas necessárias no Supabase:
1. `database_setup.sql` (Estrutura base)
2. `create_products_table.sql` (Produtos)
3. `create_notification_tables.sql` (Notificações)

### 4. Configuração da Automação (Edge Functions)

Para ativar o envio automático de notificações, siga o **[Guia de Deploy](./docs/edge_function_deploy_guide.md)**.

---

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Moneyback Platform** - Desenvolvido para maximizar a retenção de clientes.
