// Supabase Edge Function para enviar emails via SendGrid
// Deploy: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'contato@fidelify.com.br'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, data } = await req.json()

    // Validação
    if (!type || !to || !data) {
      throw new Error('Missing required fields: type, to, data')
    }

    // Montar email baseado no tipo
    let subject = ''
    let html = ''

    switch (type) {
      case 'welcome':
        subject = `Bem-vindo ao ${data.companyName}!`
        html = getWelcomeEmailHTML(data)
        break

      case 'cashback_received':
        subject = `Você recebeu R$ ${data.cashbackAmount.toFixed(2)} em cashback!`
        html = getCashbackReceivedHTML(data)
        break

      case 'cashback_redeemed':
        subject = `Cashback resgatado: R$ ${data.redeemedAmount.toFixed(2)}`
        html = getCashbackRedeemedHTML(data)
        break

      case 'cashback_expiring':
        subject = `⚠️ Seu cashback de R$ ${data.expiringAmount.toFixed(2)} vai vencer em ${data.expirationDate}!`
        html = getCashbackExpiringHTML(data)
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Enviar via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: { email: FROM_EMAIL, name: data.companyName || 'Fidelify' },
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid error: ${error}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// ==================== EMAIL TEMPLATES ====================

function getWelcomeEmailHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">🎉 Bem-vindo!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Olá <strong>${data.name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            É um prazer ter você conosco no <strong>${data.companyName}</strong>!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            A partir de agora, a cada compra você acumula cashback e pode usar como desconto nas próximas compras!
          </p>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #555;">
              <strong>💡 Dica:</strong> Não esqueça de usar seu cashback antes que expire!
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Qualquer dúvida, estamos à disposição!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Atenciosamente,<br>
            <strong>${data.companyName}</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${data.companyName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getCashbackReceivedHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">🎉 Cashback Recebido!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Você acaba de receber cashback! 🎊
          </p>
          
          <!-- Cashback Amount Box -->
          <div style="background-color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 42px; font-weight: bold; color: #10b981; margin-bottom: 10px;">
              R$ ${data.cashbackAmount.toFixed(2)}
            </div>
            <div style="font-size: 18px; color: #666; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
              <strong>Saldo total:</strong> R$ ${data.cashbackBalance.toFixed(2)}
            </div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Continue comprando e acumulando mais benefícios!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Obrigado por ser nosso cliente! 💚
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${data.companyName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getCashbackRedeemedHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">✅ Cashback Resgatado!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Olá <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Seu cashback foi resgatado com sucesso!
          </p>
          
          <!-- Redeemed Amount Box -->
          <div style="background-color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Valor resgatado</div>
            <div style="font-size: 42px; font-weight: bold; color: #3b82f6; margin-bottom: 10px;">
              R$ ${data.redeemedAmount.toFixed(2)}
            </div>
            <div style="font-size: 16px; color: #666; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
              <strong>Saldo restante:</strong> R$ ${data.remainingBalance.toFixed(2)}
            </div>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #555;">
              <strong>💡 Dica:</strong> Continue comprando para acumular mais cashback!
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Obrigado por usar seu cashback conosco! 💙
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${data.companyName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getCashbackExpiringHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px;">⚠️ Seu Cashback Vai Vencer!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Olá <strong>${data.clientName}</strong>,</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>⏰ Atenção!</strong> Você tem cashback prestes a vencer. Não perca essa oportunidade!
            </p>
          </div>
          
          <!-- Expiring Amount Box -->
          <div style="background-color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px; margin-bottom: 10px;">Valor que vai vencer</div>
            <div style="font-size: 42px; font-weight: bold; color: #f59e0b; margin-bottom: 10px;">
              R$ ${data.expiringAmount.toFixed(2)}
            </div>
            <div style="font-size: 16px; color: #dc2626; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
              ⏳ Vence em: ${data.expirationDate}
            </div>
          </div>
          
          <p style="text-align: center; font-size: 18px; font-weight: bold; color: #333;">
            Saldo total disponível: R$ ${data.totalBalance.toFixed(2)}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              <strong>Use seu cashback antes que expire!</strong>
            </p>
            <p style="font-size: 14px; color: #666;">
              Faça uma compra agora e aproveite seus benefícios.
            </p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; text-align: center; color: #555;">
              <strong>💡 Lembrete:</strong> Cashback é dinheiro de volta! Use agora e economize.
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Não deixe seu cashback expirar! 🏃‍♂️💨
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${data.companyName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
