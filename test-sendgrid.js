// Script de teste para verificar integração SendGrid
import sgMail from '@sendgrid/mail';

// Configurar API Key
const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
sgMail.setApiKey(SENDGRID_API_KEY);

// Configurar mensagem de teste
const msg = {
  to: 'victorhugosantanaalmeida@gmail.com', // Altere para seu email
  from: 'contato@fidelify.com.br', // Email verificado no SendGrid
  subject: 'Teste de Integração SendGrid - Fidelify',
  text: 'Se você recebeu este email, a integração com SendGrid está funcionando perfeitamente!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>✅ Teste de Integração SendGrid</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Olá!</p>
        <p><strong>Parabéns! A integração com SendGrid está funcionando perfeitamente!</strong></p>
        <p>Este é um email de teste enviado através da API do SendGrid.</p>
        <p>Data e hora do teste: ${new Date().toLocaleString('pt-BR')}</p>
        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <p><strong>Detalhes técnicos:</strong></p>
          <ul>
            <li>API: SendGrid v3</li>
            <li>Plataforma: Fidelify - Cashback Platform</li>
            <li>Status: Integração confirmada ✅</li>
          </ul>
        </div>
        <p>Agora você pode usar o serviço de emails para:</p>
        <ul>
          <li>📧 Enviar emails de boas-vindas</li>
          <li>🎉 Notificar cashback recebido</li>
          <li>📢 Enviar notificações personalizadas</li>
          <li>💌 Comunicação com clientes</li>
        </ul>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>Este é um email automático de teste.</p>
        <p>&copy; ${new Date().getFullYear()} Fidelify. Todos os direitos reservados.</p>
      </div>
    </div>
  `,
};

// Enviar email
console.log('📧 Enviando email de teste...\n');
console.log('Para:', msg.to);
console.log('De:', msg.from);
console.log('Assunto:', msg.subject);
console.log('\n⏳ Aguarde...\n');

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email enviado com sucesso!\n');
    console.log('🎉 Integração SendGrid confirmada!');
    console.log('\n📬 Verifique sua caixa de entrada (e spam) em:', msg.to);
  })
  .catch((error) => {
    console.error('❌ Erro ao enviar email:\n');
    console.error(error);

    if (error.response) {
      console.error('\n📝 Resposta do SendGrid:');
      console.error(error.response.body);
    }
  });
