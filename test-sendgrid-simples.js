// Script de teste com email temporário
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
sgMail.setApiKey(SENDGRID_API_KEY);

// ⚠️ IMPORTANTE: Este é o email verificado no SendGrid
const FROM_EMAIL = 'contato@fidelify.com.br'; // Email verificado no SendGrid
const TO_EMAIL = 'victorhugosantanaalmeida@gmail.com'; // Email de destino

const msg = {
  to: TO_EMAIL,
  from: FROM_EMAIL, // Precisa estar verificado no SendGrid
  subject: '🎉 Teste de Integração SendGrid - Fidelify',
  text: 'Se você recebeu este email, a integração com SendGrid está funcionando perfeitamente!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>✅ Integração SendGrid Confirmada!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p><strong>Parabéns! 🎉</strong></p>
        <p>A integração com SendGrid está funcionando perfeitamente!</p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Status: Integração Confirmada</strong></p>
        </div>

        <p><strong>O que funciona agora:</strong></p>
        <ul>
          <li>📧 Envio de emails genéricos</li>
          <li>🎉 Emails de boas-vindas para novos clientes</li>
          <li>💰 Confirmações de cashback</li>
          <li>📢 Notificações personalizadas</li>
        </ul>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚡ Próximo Passo:</strong><br>
            Integre os emails com seu sistema de cadastro de clientes e transações!
          </p>
        </div>

        <p style="color: #666; font-size: 14px;">
          <strong>Data do teste:</strong> ${new Date().toLocaleString('pt-BR')}<br>
          <strong>Plataforma:</strong> Fidelify - Cashback Platform<br>
          <strong>API:</strong> SendGrid v3
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px;">
        <p>Este é um email automático de teste do sistema Fidelify.</p>
        <p>&copy; ${new Date().getFullYear()} Fidelify. Todos os direitos reservados.</p>
      </div>
    </div>
  `,
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📧 TESTE DE INTEGRAÇÃO SENDGRID');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📨 De:      ', FROM_EMAIL);
console.log('📬 Para:    ', TO_EMAIL);
console.log('📝 Assunto: ', msg.subject);
console.log('\n⏳ Enviando...\n');

sgMail
  .send(msg)
  .then(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCESSO! Email enviado com êxito!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Integração SendGrid confirmada e funcionando!');
    console.log('\n📬 Verifique sua caixa de entrada (e spam):');
    console.log('   ' + TO_EMAIL);
    console.log('\n✨ Próximos passos:');
    console.log('   1. Integrar com cadastro de clientes');
    console.log('   2. Integrar com sistema de transações');
    console.log('   3. Configurar emails automáticos');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  })
  .catch((error) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERRO AO ENVIAR EMAIL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (error.code === 403) {
      console.log('🚨 Email do remetente não está verificado!\n');
      console.log('📋 Instruções para resolver:\n');
      console.log('1. Acesse: https://app.sendgrid.com/settings/sender_auth/senders');
      console.log('2. Clique em "Create New Sender"');
      console.log('3. Adicione e verifique o email:', FROM_EMAIL);
      console.log('4. Verifique o email de confirmação do SendGrid');
      console.log('5. Rode este script novamente\n');
      console.log('📖 Guia completo: VERIFICAR_REMETENTE_SENDGRID.md\n');
    } else {
      console.error('Detalhes do erro:');
      console.error(error);
    }

    if (error.response) {
      console.log('\n📝 Resposta do SendGrid:');
      console.log(JSON.stringify(error.response.body, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
