/**
 * Script de teste para verificar a integração do SendGrid
 * 
 * Execute este arquivo para testar o envio de emails
 */

import { sendEmail, sendWelcomeEmail } from './services/emailService';

/**
 * Teste 1: Enviar email simples
 */
const testSimpleEmail = async () => {
  console.log('\n🧪 Teste 1: Enviando email simples...');
  
  const result = await sendEmail({
    to: 'seu-email@exemplo.com', // ALTERE ESTE EMAIL
    subject: 'Teste de Integração SendGrid',
    text: 'Se você recebeu este email, a integração com SendGrid está funcionando!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #667eea;">✅ Teste de Integração SendGrid</h1>
        <p>Se você recebeu este email, a integração com SendGrid está funcionando perfeitamente!</p>
        <p>Data e hora: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `
  });

  if (result.success) {
    console.log('✅ Email enviado com sucesso!');
  } else {
    console.error('❌ Erro ao enviar email:', result.error);
  }

  return result;
};

/**
 * Teste 2: Enviar email de boas-vindas
 */
const testWelcomeEmail = async () => {
  console.log('\n🧪 Teste 2: Enviando email de boas-vindas...');
  
  const result = await sendWelcomeEmail({
    to: 'seu-email@exemplo.com', // ALTERE ESTE EMAIL
    name: 'Usuário Teste',
    companyName: 'Fidelify - Plataforma de Cashback'
  });

  if (result.success) {
    console.log('✅ Email de boas-vindas enviado com sucesso!');
  } else {
    console.error('❌ Erro ao enviar email:', result.error);
  }

  return result;
};

/**
 * Executar todos os testes
 */
const runAllTests = async () => {
  console.log('🚀 Iniciando testes de integração SendGrid...\n');
  console.log('⚠️  IMPORTANTE: Altere o email de destino antes de executar!\n');

  try {
    await testSimpleEmail();
    await testWelcomeEmail();
    
    console.log('\n✅ Todos os testes concluídos!');
    console.log('\n📧 Verifique sua caixa de entrada (e spam) para ver os emails.');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
};

// Executar testes se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testSimpleEmail, testWelcomeEmail, runAllTests };
