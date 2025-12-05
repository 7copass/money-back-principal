// Supabase Edge Function - Enviar emails de cashback expirando
// Deploy: supabase functions deploy notify-expiring-cashback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

Deno.serve(async (req) => {
  try {
    console.log('[Expiring Cashback] Starting notification check...')

    // Buscar todas as empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')

    if (companiesError) throw companiesError

    let totalNotifications = 0
    let totalErrors = 0

    // Para cada empresa, processar cashbacks expirando
    for (const company of companies || []) {
      console.log(`[Company ${company.name}] Checking expiring cashback...`)

      // Buscar transações que vão expirar nos próximos 7 dias
      const today = new Date()
      const in7Days = new Date()
      in7Days.setDate(today.getDate() + 7)

      const { data: expiringTransactions, error: transError } = await supabase
        .from('transactions')
        .select('*, client_id, cashback_expiration_date, cashback_value')
        .eq('company_id', company.id)
        .eq('status', 'Disponível')
        .gte('cashback_expiration_date', today.toISOString().split('T')[0])
        .lte('cashback_expiration_date', in7Days.toISOString().split('T')[0])

      if (transError) {
        console.error(`[Company ${company.name}] Error:`, transError)
        continue
      }

      // Agrupar por cliente
      const clientsCashback: Map<string, { total: number, expDate: string }> = new Map()

      for (const trans of expiringTransactions || []) {
        const existing = clientsCashback.get(trans.client_id) || { total: 0, expDate: trans.cashback_expiration_date }
        clientsCashback.set(trans.client_id, {
          total: existing.total + trans.cashback_value,
          expDate: trans.cashback_expiration_date
        })
      }

      // Enviar email para cada cliente
      for (const [clientId, cashbackData] of clientsCashback.entries()) {
        try {
          // Buscar dados do cliente
          const { data: client } = await supabase
            .from('clients')
            .select('name, email, total_cashback')
            .eq('id', clientId)
            .single()

          if (!client?.email) continue

          // Chamar a Edge Function de envio de email
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'cashback_expiring',
              to: client.email,
              data: {
                clientName: client.name,
                expiringAmount: cashbackData.total,
                expirationDate: new Date(cashbackData.expDate).toLocaleDateString('pt-BR'),
                totalBalance: client.total_cashback,
                companyName: company.name
              }
            })
          })

          if (response.ok) {
            console.log(`✅ Email expiring sent to: ${client.email}`)
            totalNotifications++
          } else {
            console.error(`❌ Failed to send email to: ${client.email}`)
            totalErrors++
          }

        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error)
          totalErrors++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalNotifications,
        totalErrors,
        message: `Processed ${totalNotifications} notifications with ${totalErrors} errors`
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[Expiring Cashback] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
