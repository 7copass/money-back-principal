/**
 * GUIA DE INTEGRAÇÃO: Emails Automáticos de Cashback
 * 
 * Este arquivo mostra como integrar os emails automáticos com o sistema de cashback
 */

import { 
  sendCashbackEmail, 
  sendCashbackRedeemedEmail, 
  sendCashbackExpiringEmail 
} from '../services/emailService';

// ==============================================================
// 1. CASHBACK RECEBIDO (quando cliente ganha cashback)
// ==============================================================

/**
 * Enviar email quando um cliente recebe cashback
 * Use isso na função addTransaction() após calcular o cashback
 */
export const notifyCashbackReceived = async (transactionData: any) => {
  // Dados da transação
  const { 
    clientEmail,
    clientName,
    cashbackAmount,
    newCashbackBalance,
    companyName 
  } = transactionData;

  // Enviar email apenas se tiver cashback e email válido
  if (cashbackAmount > 0 && clientEmail) {
    const result = await sendCashbackEmail({
      to: clientEmail,
      clientName: clientName,
      cashbackAmount: cashbackAmount,
      cashbackBalance: newCashbackBalance,
      companyName: companyName || 'Fidelify'
    });

    if (result.success) {
      console.log('✅ Email de cashback enviado para:', clientEmail);
    } else {
      console.error('❌ Erro ao enviar email:', result.error);
    }
  }
};

// Exemplo de integração com addTransaction:
/*
export const addTransactionWithEmail = async (companyId: string, data: any) => {
  // 1. Adicionar transação
  const transaction = await api.addTransaction(companyId, data);
  
  // 2. Enviar email de confirmação
  await notifyCashbackReceived({
    clientEmail: data.clientEmail,
    clientName: data.clientName,
    cashbackAmount: transaction.cashbackAmount,
    newCashbackBalance: transaction.totalCashback,
    companyName: 'Fidelify'
  });
  
  return transaction;
};
*/

// ==============================================================
// 2. CASHBACK RESGATADO (quando cliente usa cashback)
// ==============================================================

/**
 * Enviar email quando um cliente resgata/usa cashback
 * Use isso na função redeemCashback() após processar o resgate
 */
export const notifyCashbackRedeemed = async (redeemData: any) => {
  const { 
    clientEmail,
    clientName,
    redeemedAmount,
    remainingBalance,
    companyName 
  } = redeemData;

  if (clientEmail) {
    const result = await sendCashbackRedeemedEmail({
      to: clientEmail,
      clientName: clientName,
      redeemedAmount: redeemedAmount,
      remainingBalance: remainingBalance,
      companyName: companyName || 'Fidelify'
    });

    if (result.success) {
      console.log('✅ Email de resgate enviado para:', clientEmail);
    } else {
      console.error('❌ Erro ao enviar email:', result.error);
    }
  }
};

// Exemplo de integração com redeemCashback:
/*
export const redeemCashbackWithEmail = async (
  companyId: string,
  clientId: string,
  sellerId: string,
  sellerName: string,
  availableCashback: number,
  purchaseValue: number
) => {
  // 1. Processar resgate
  const result = await api.redeemCashback(
    companyId,
    clientId,
    sellerId,
    sellerName,
    availableCashback,
    purchaseValue
  );
  
  // 2. Enviar email de confirmação
  if (result.success) {
    await notifyCashbackRedeemed({
      clientEmail: result.clientEmail,
      clientName: result.clientName,
      redeemedAmount: availableCashback,
      remainingBalance: result.newBalance,
      companyName: 'Fidelify'
    });
  }
  
  return result;
};
*/

// ==============================================================
// 3. CASHBACK PRESTES A VENCER (alerta de expiração)
// ==============================================================

/**
 * Enviar email de alerta quando cashback está prestes a vencer
 * Use isso em um cron job ou verificação periódica
 */
export const notifyCashbackExpiring = async (expirationData: any) => {
  const { 
    clientEmail,
    clientName,
    expiringAmount,
    expirationDate,
    totalBalance,
    companyName 
  } = expirationData;

  if (clientEmail) {
    const result = await sendCashbackExpiringEmail({
      to: clientEmail,
      clientName: clientName,
      expiringAmount: expiringAmount,
      expirationDate: expirationDate,
      totalBalance: totalBalance,
      companyName: companyName || 'Fidelify'
    });

    if (result.success) {
      console.log('✅ Email de expiração enviado para:', clientEmail);
    } else {
      console.error('❌ Erro ao enviar email:', result.error);
    }
  }
};

// ==============================================================
// EXEMPLO DE CRON JOB PARA VERIFICAR CASHBACK EXPIRANDO
// ==============================================================

/**
 * Função para verificar e notificar cashback prestes a vencer
 * Execute isso diariamente via cron job
 */
export const checkAndNotifyExpiringCashback = async (companyId: string) => {
  console.log('🔍 Verificando cashback prestes a vencer...');
  
  // 1. Buscar clientes com cashback próximo da expiração
  // (você vai precisar criar essa query no Supabase)
  /*
  const { data: expiringCashbacks } = await supabase
    .from('clients')
    .select('id, name, email, cashback_balance, cashback_expiration_date')
    .eq('company_id', companyId)
    .not('cashback_balance', 'eq', 0)
    .not('cashback_expiration_date', 'is', null)
    .lte('cashback_expiration_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 dias
    .gte('cashback_expiration_date', new Date().toISOString()); // Ainda não expirado
  */
  
  // Exemplo simulado:
  const expiringCashbacks = [
    {
      email: 'cliente@exemplo.com',
      name: 'João Silva',
      cashback_balance: 50.00,
      expiring_amount: 20.00,
      cashback_expiration_date: '2025-12-10'
    }
  ];
  
  // 2. Enviar emails para cada cliente
  for (const client of expiringCashbacks) {
    await notifyCashbackExpiring({
      clientEmail: client.email,
      clientName: client.name,
      expiringAmount: client.expiring_amount,
      expirationDate: new Date(client.cashback_expiration_date).toLocaleDateString('pt-BR'),
      totalBalance: client.cashback_balance,
      companyName: 'Fidelify'
    });
  }
  
  console.log(`✅ ${expiringCashbacks.length} notificações enviadas`);
};

// ==============================================================
// TESTES RÁPIDOS
// ==============================================================

/**
 * Testar email de cashback recebido
 */
export const testCashbackReceivedEmail = async () => {
  await sendCashbackEmail({
    to: 'victorhugosantanaalmeida@gmail.com',
    clientName: 'João Silva',
    cashbackAmount: 15.50,
    cashbackBalance: 75.00,
    companyName: 'Fidelify'
  });
};

/**
 * Testar email de cashback resgatado
 */
export const testCashbackRedeemedEmail = async () => {
  await sendCashbackRedeemedEmail({
    to: 'victorhugosantanaalmeida@gmail.com',
    clientName: 'João Silva',
    redeemedAmount: 30.00,
    remainingBalance: 45.00,
    companyName: 'Fidelify'
  });
};

/**
 * Testar email de cashback expirando
 */
export const testCashbackExpiringEmail = async () => {
  await sendCashbackExpiringEmail({
    to: 'victorhugosantanaalmeida@gmail.com',
    clientName: 'João Silva',
    expiringAmount: 20.00,
    expirationDate: '10/12/2025',
    totalBalance: 55.00,
    companyName: 'Fidelify'
  });
};

export default {
  notifyCashbackReceived,
  notifyCashbackRedeemed,
  notifyCashbackExpiring,
  checkAndNotifyExpiringCashback,
  testCashbackReceivedEmail,
  testCashbackRedeemedEmail,
  testCashbackExpiringEmail,
};
