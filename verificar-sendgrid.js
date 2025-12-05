// Teste para verificar integração SendGrid
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
sgMail.setApiKey(SENDGRID_API_KEY);

const msg = {
  to: 'victorhugosantanaalmeida@gmail.com',
  from: 'contato@fidelify.com.br',
  subject: 'Verificação SendGrid - Teste de Integração',
  text: 'Este é um email de teste para verificar a integração com SendGrid.',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #667eea;">✅ Teste de Verificação SendGrid</h1>
      <p>Este email foi enviado para verificar a integração com SendGrid.</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>Status:</strong> Integração funcionando!</p>
    </div>
  `,
};

console.log('🚀 Enviando email de verificação...');
console.log('De:', msg.from);
console.log('Para:', msg.to);
console.log('');

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email enviado com sucesso!');
    console.log('');
    console.log('📝 Agora clique em "Verificar integração" no painel do SendGrid');
    console.log('');
  })
  .catch((error) => {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error(error.response.body);
    }
  });
