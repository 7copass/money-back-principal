// Teste de todos os emails de cashback
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const FROM_EMAIL = 'contato@fidelify.com.br';
const YOUR_EMAIL = 'victorhugosantanaalmeida@gmail.com';

sgMail.setApiKey(SENDGRID_API_KEY);

console.log('🧪 TESTANDO TODOS OS EMAILS DE CASHBACK\n');
console.log('═'.repeat(60));

// ================================================================
// 1. CASHBACK RECEBIDO (Verde) - Quando cliente GANHA cashback
// ================================================================

console.log('\n📧 1. Enviando: CASHBACK RECEBIDO (🟢 Verde)');
console.log('   Usa quando: Cliente ganha cashback em uma compra');

await sgMail.send({
  to: YOUR_EMAIL,
  from: FROM_EMAIL,
  subject: 'Você recebeu R$ 15,50 em cashback!',
  html: `
  < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>🎉 Cashback Recebido!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Olá <strong>João Silva</strong>,</p>
        <p>Você acaba de receber cashback!</p>
        <div style="background: white; padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="font-size: 36px; font-weight: bold; color: #10b981;">R$ 15,50</div>
          <div style="font-size: 18px; color: #666; margin-top: 10px;">Saldo total: R$ 75,00</div>
        </div>
        <p>Continue comprando e acumulando mais benefícios!</p>
        <p>Obrigado por ser nosso cliente! 💚</p>
      </div>
    </div >
  `
});

console.log('   ✅ Enviado!\n');
await new Promise(r => setTimeout(r, 2000));

// ================================================================
// 2. CASHBACK RESGATADO (Azul) - Quando cliente USA cashback
// ================================================================

console.log('📧 2. Enviando: CASHBACK RESGATADO (🔵 Azul)');
console.log('   Usa quando: Cliente usa cashback em uma compra');

await sgMail.send({
  to: YOUR_EMAIL,
  from: FROM_EMAIL,
  subject: 'Cashback resgatado: R$ 30,00',
  html: `
  < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>✅ Cashback Resgatado!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Olá <strong>João Silva</strong>,</p>
        <p>Seu cashback foi resgatado com sucesso!</p>
        <div style="background: white; padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Valor resgatado</div>
          <div style="font-size: 36px; font-weight: bold; color: #3b82f6;">R$ 30,00</div>
          <div style="font-size: 16px; color: #666; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <strong>Saldo restante:</strong> R$ 45,00
          </div>
        </div>
        <div style="background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>💡 Dica:</strong> Continue comprando para acumular mais cashback!
          </p>
        </div>
        <p>Obrigado por usar seu cashback conosco! 💙</p>
      </div>
    </div >
  `
});

console.log('   ✅ Enviado!\n');
await new Promise(r => setTimeout(r, 2000));

// ================================================================
// 3. CASHBACK EXPIRANDO (Laranja) - Quando vai vencer
// ================================================================

console.log('📧 3. Enviando: CASHBACK PRESTES A VENCER (🟡 Laranja)');
console.log('   Usa quando: Cashback vai expirar em breve');

await sgMail.send({
  to: YOUR_EMAIL,
  from: FROM_EMAIL,
  subject: '⚠️ Seu cashback de R$ 20,00 vai vencer em 10/12/2025!',
  html: `
  < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>⚠️ Seu Cashback Vai Vencer!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Olá <strong>João Silva</strong>,</p>
        <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">
            <strong>⏰ Atenção!</strong> Você tem cashback prestes a vencer. Não perca essa oportunidade!
          </p>
        </div>
        <div style="background: white; padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Valor que vai vencer</div>
          <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">R$ 20,00</div>
          <div style="font-size: 16px; color: #dc2626; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            ⏳ Vence em: 10/12/2025
          </div>
        </div>
        <p style="text-align: center;">
          <strong style="font-size: 18px;">Saldo total disponível: R$ 55,00</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Use seu cashback antes que expire!</strong></p>
          <p style="color: #666;">Faça uma compra agora e aproveite seus benefícios.</p>
        </div>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; text-align: center;">
            <strong>💡 Lembrete:</strong> Cashback é dinheiro de volta! Use agora e economize.
          </p>
        </div>
        <p>Não deixe seu cashback expirar! 🏃‍♂️💨</p>
      </div>
    </div >
  `
});

console.log('   ✅ Enviado!\n');

console.log('═'.repeat(60));
console.log('\n🎉 TODOS OS 3 EMAILS ENVIADOS COM SUCESSO!\n');
console.log('📬 Verifique sua caixa de entrada:');
console.log('   ' + YOUR_EMAIL);
console.log('\n📧 Você receberá 3 emails:');
console.log('   🟢 1. Cashback Recebido (header verde)');
console.log('   🔵 2. Cashback Resgatado (header azul)');
console.log('   🟡 3. Cashback Expirando (header laranja)\n');
console.log('═'.repeat(60));
