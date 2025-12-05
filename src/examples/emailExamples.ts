/**
 * Exemplos de uso do serviço de emails
 * 
 * Este arquivo contém exemplos de como usar as funções de envio de email
 * integradas com SendGrid no projeto.
 */

import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendNotificationEmail, 
  sendCashbackEmail 
} from '../services/emailService';

/**
 * Exemplo 1: Enviar email genérico
 */
export const exampleGenericEmail = async () => {
  const result = await sendEmail({
    to: 'cliente@exemplo.com',
    subject: 'Teste de Email',
    text: 'Este é um email de teste',
    html: '<h1>Email de Teste</h1><p>Este é um email de teste</p>'
  });

  if (result.success) {
    console.log('Email enviado com sucesso!');
  } else {
    console.error('Erro ao enviar email:', result.error);
  }
};

/**
 * Exemplo 2: Enviar email de boas-vindas quando um novo cliente é cadastrado
 */
export const exampleWelcomeEmail = async (clientData: any) => {
  const result = await sendWelcomeEmail({
    to: clientData.email,
    name: clientData.name,
    companyName: 'Fidelify' // ou usar o nome da empresa do banco
  });

  if (result.success) {
    console.log('Email de boas-vindas enviado!');
  } else {
    console.error('Erro ao enviar email de boas-vindas:', result.error);
  }
};

/**
 * Exemplo 3: Enviar notificação ao cliente
 */
export const exampleNotificationEmail = async () => {
  const result = await sendNotificationEmail({
    to: 'cliente@exemplo.com',
    clientName: 'João Silva',
    message: 'Você tem uma nova oferta especial! Aproveite 20% de desconto em todos os produtos.',
    companyName: 'Fidelify'
  });

  if (result.success) {
    console.log('Notificação enviada!');
  } else {
    console.error('Erro ao enviar notificação:', result.error);
  }
};

/**
 * Exemplo 4: Enviar confirmação de cashback após uma transação
 */
export const exampleCashbackEmail = async (transactionData: any) => {
  const result = await sendCashbackEmail({
    to: transactionData.clientEmail,
    clientName: transactionData.clientName,
    cashbackAmount: transactionData.cashbackAmount,
    cashbackBalance: transactionData.totalCashbackBalance,
    companyName: 'Fidelify'
  });

  if (result.success) {
    console.log('Email de cashback enviado!');
  } else {
    console.error('Erro ao enviar email de cashback:', result.error);
  }
};

/**
 * Exemplo 5: Integração com addClient - enviar boas-vindas automaticamente
 */
export const addClientWithWelcomeEmail = async (companyId: string, clientData: any) => {
  // Primeiro, adicionar o cliente usando a função existente
  // import { api } from '../services';
  // const newClient = await api.addClient(companyId, clientData);
  
  // Depois, enviar email de boas-vindas
  if (clientData.email) {
    await sendWelcomeEmail({
      to: clientData.email,
      name: clientData.name,
      companyName: 'Fidelify'
    });
  }
  
  return; // newClient;
};

/**
 * Exemplo 6: Integração com addTransaction - notificar cashback
 */
export const addTransactionWithEmailNotification = async (companyId: string, transactionData: any) => {
  // Primeiro, adicionar a transação
  // import { api } from '../services';
  // const transaction = await api.addTransaction(companyId, transactionData);
  
  // Se tiver cashback e email do cliente, enviar notificação
  if (transactionData.cashbackAmount > 0 && transactionData.clientEmail) {
    await sendCashbackEmail({
      to: transactionData.clientEmail,
      clientName: transactionData.clientName,
      cashbackAmount: transactionData.cashbackAmount,
      cashbackBalance: transactionData.totalBalance || transactionData.cashbackAmount,
      companyName: 'Fidelify'
    });
  }
  
  return; // transaction;
};

export default {
  exampleGenericEmail,
  exampleWelcomeEmail,
  exampleNotificationEmail,
  exampleCashbackEmail,
  addClientWithWelcomeEmail,
  addTransactionWithEmailNotification,
};
