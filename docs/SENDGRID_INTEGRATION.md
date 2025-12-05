# Integração SendGrid - Serviço de Emails

## 📧 Visão Geral

Este projeto agora possui integração completa com o **SendGrid** para envio de emails transacionais e notificações aos clientes.

## 🔧 Configuração

### 1. Instalação

O pacote já está instalado:
```bash
npm install @sendgrid/mail
```

### 2. Variáveis de Ambiente

As seguintes variáveis foram configuradas no `.env.local`:

```bash
VITE_SENDGRID_API_KEY=SUA_API_KEY_DO_SENDGRID_AQUI
VITE_FROM_EMAIL=noreply@fidelify.com.br
```

### 3. Verificar Remetente no SendGrid

⚠️ **IMPORTANTE**: Antes de enviar emails em produção, você precisa verificar o domínio ou email do remetente no SendGrid:

1. Acesse [https://app.sendgrid.com/settings/sender_auth](https://app.sendgrid.com/settings/sender_auth)
2. Configure a autenticação de remetente:
   - **Opção 1 (Recomendada)**: Verificar domínio completo (fidelify.com.br)
   - **Opção 2**: Verificar email individual (noreply@fidelify.com.br)

## 📚 Funções Disponíveis

### 1. Email Genérico
```typescript
import { sendEmail } from './services/emailService';

await sendEmail({
  to: 'cliente@exemplo.com',
  subject: 'Assunto do Email',
  text: 'Texto simples',
  html: '<h1>HTML opcional</h1>'
});
```

### 2. Email de Boas-vindas
```typescript
import { sendWelcomeEmail } from './services/emailService';

await sendWelcomeEmail({
  to: 'cliente@exemplo.com',
  name: 'João Silva',
  companyName: 'Fidelify'
});
```

### 3. Email de Notificação
```typescript
import { sendNotificationEmail } from './services/emailService';

await sendNotificationEmail({
  to: 'cliente@exemplo.com',
  clientName: 'João Silva',
  message: 'Você tem uma nova oferta especial!',
  companyName: 'Fidelify'
});
```

### 4. Email de Cashback
```typescript
import { sendCashbackEmail } from './services/emailService';

await sendCashbackEmail({
  to: 'cliente@exemplo.com',
  clientName: 'João Silva',
  cashbackAmount: 10.50,
  cashbackBalance: 50.00,
  companyName: 'Fidelify'
});
```

## 🎯 Casos de Uso

### Integração com Cadastro de Cliente

```typescript
import { api } from './services';
import { sendWelcomeEmail } from './services/emailService';

// Ao cadastrar um novo cliente
const clientData = {
  name: 'João Silva',
  email: 'joao@exemplo.com',
  // ... outros dados
};

// Cadastrar cliente
const newClient = await api.addClient(companyId, clientData);

// Enviar email de boas-vindas
if (clientData.email) {
  await sendWelcomeEmail({
    to: clientData.email,
    name: clientData.name,
    companyName: 'Fidelify'
  });
}
```

### Integração com Transações (Cashback)

```typescript
import { api } from './services';
import { sendCashbackEmail } from './services/emailService';

// Ao adicionar uma transação com cashback
const transactionData = {
  clientId: 'client-id',
  sellerId: 'seller-id',
  value: 100.00,
  cashbackPercentage: 10,
  // ... outros dados
};

const transaction = await api.addTransaction(companyId, transactionData);

// Enviar email de confirmação de cashback
if (transaction.cashbackAmount > 0 && clientEmail) {
  await sendCashbackEmail({
    to: clientEmail,
    clientName: clientName,
    cashbackAmount: transaction.cashbackAmount,
    cashbackBalance: clientTotalBalance,
    companyName: 'Fidelify'
  });
}
```

### Integração com Sistema de Notificações

```typescript
import { sendNotificationEmail } from './services/emailService';

// Ao enviar notificação agendada
const sendScheduledNotification = async (notification: any) => {
  await sendNotificationEmail({
    to: notification.clientEmail,
    clientName: notification.clientName,
    message: notification.message,
    companyName: 'Fidelify'
  });
};
```

## 🎨 Templates de Email

Todos os emails incluem:
- ✅ Design moderno e responsivo
- ✅ Templates HTML estilizados
- ✅ Branding consistente
- ✅ Versão em texto simples (fallback)
- ✅ Footer com informações da empresa

### Personalização

Para personalizar os templates, edite o arquivo `src/services/emailService.ts`:

```typescript
// Exemplo de personalização do template de boas-vindas
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <!-- Adicione seus estilos aqui -->
    </head>
    <body>
      <!-- Personalize o conteúdo aqui -->
    </body>
  </html>
`;
```

## 🔍 Monitoramento e Debug

### Verificar Logs
```typescript
// Os logs aparecem no console
console.log('Email enviado com sucesso para:', emailData.to);
console.error('Erro ao enviar email:', error);
```

### Status de Envio
Todas as funções retornam um objeto com status:

```typescript
const result = await sendEmail(emailData);

if (result.success) {
  console.log('Email enviado!');
} else {
  console.error('Erro:', result.error);
}
```

### Monitoramento no SendGrid

Acesse o dashboard do SendGrid para ver:
- Emails enviados
- Emails entregues
- Bounces
- Aberturas
- Cliques

Link: [https://app.sendgrid.com/statistics](https://app.sendgrid.com/statistics)

## ⚠️ Observações Importantes

1. **Limite de Envio**: A conta SendGrid pode ter limites diários. Verifique seu plano.

2. **Verificação de Remetente**: Configure a autenticação do remetente antes de usar em produção.

3. **Emails de Teste**: Para testar, use emails válidos ou configure o SendGrid em modo sandbox.

4. **Segurança da API Key**: 
   - ❌ NUNCA commite a API key no código
   - ✅ Use variáveis de ambiente
   - ✅ Adicione `.env.local` no `.gitignore`

5. **Tratamento de Erros**: Sempre trate os erros de envio de email:
   ```typescript
   try {
     await sendEmail(emailData);
   } catch (error) {
     console.error('Falha ao enviar email:', error);
     // Continue a execução do código mesmo se o email falhar
   }
   ```

## 📁 Arquivos Criados

```
src/
  services/
    emailService.ts          # Serviço principal de emails
  examples/
    emailExamples.ts         # Exemplos de uso
docs/
  SENDGRID_INTEGRATION.md    # Este arquivo
```

## 🚀 Próximos Passos

1. ✅ Integração básica configurada
2. ⏳ Configurar autenticação de remetente no SendGrid
3. ⏳ Integrar emails com cadastro de clientes
4. ⏳ Integrar emails com sistema de transações
5. ⏳ Integrar emails com sistema de notificações agendadas
6. ⏳ Criar templates personalizados por empresa
7. ⏳ Implementar sistema de preferências de email (opt-in/opt-out)

## 📞 Suporte

- Documentação SendGrid: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- API Reference: [https://docs.sendgrid.com/api-reference](https://docs.sendgrid.com/api-reference)
- Status: [https://status.sendgrid.com](https://status.sendgrid.com)

---

**Implementado em**: 04/12/2025  
**Versão**: 1.0.0
