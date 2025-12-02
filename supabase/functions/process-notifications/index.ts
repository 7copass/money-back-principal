import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

interface NotificationTemplate {
    id: string
    company_id: string
    notification_type: string
    message_template: string
    is_active: boolean
    schedule_hour: number
}

interface Transaction {
    id: string
    client_id: string
    cashback_value: number
    cashback_expiration_date: string
    clients: {
        id: string
        name: string
        phone: string
    }
}

serve(async (req) => {
    try {
        // Criar cliente Supabase usando as variáveis de ambiente automáticas
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        console.log('[CRON] Starting notification processing...')

        // Buscar todas as empresas com notificações ativas
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name')
            .not('id', 'is', null)

        if (companiesError) throw companiesError

        let totalProcessed = 0
        let totalSent = 0
        let totalErrors = 0

        // Processar cada empresa
        for (const company of companies || []) {
            try {
                const result = await processCompanyNotifications(supabase, company.id)
                totalProcessed += result.processed
                totalSent += result.sent
                totalErrors += result.errors

                console.log(`[CRON] Company ${company.name}: ${result.sent} sent, ${result.errors} errors`)
            } catch (error) {
                console.error(`[CRON] Error processing company ${company.id}:`, error)
                totalErrors++
            }
        }

        console.log(`[CRON] Finished: ${totalProcessed} processed, ${totalSent} sent, ${totalErrors} errors`)

        return new Response(
            JSON.stringify({
                success: true,
                processed: totalProcessed,
                sent: totalSent,
                errors: totalErrors,
                timestamp: new Date().toISOString()
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('[CRON] Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

async function processCompanyNotifications(supabase: any, companyId: string) {
    // Buscar configurações
    const { data: settings } = await supabase
        .from('companies')
        .select('notifications_enabled')
        .eq('id', companyId)
        .single()

    if (!settings?.notifications_enabled) {
        return { processed: 0, sent: 0, errors: 0 }
    }

    // Buscar templates ativos
    const { data: templates } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)

    if (!templates || templates.length === 0) {
        return { processed: 0, sent: 0, errors: 0 }
    }

    // Buscar transações com cashback não resgatado e não expirado
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, client_id, cashback_value, cashback_expiration_date, clients(id, name, phone)')
        .eq('company_id', companyId)
        .eq('cashback_redeemed', false)
        .not('cashback_expiration_date', 'is', null)

    if (!transactions || transactions.length === 0) {
        return { processed: 0, sent: 0, errors: 0 }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let processed = 0
    let sent = 0
    let errors = 0

    // Processar cada transação
    for (const transaction of transactions) {
        const expirationDate = new Date(transaction.cashback_expiration_date)
        expirationDate.setHours(0, 0, 0, 0)

        const daysUntilExpiration = Math.ceil(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Determinar tipo de notificação
        let notificationType = null
        if (daysUntilExpiration === 7) notificationType = 'expiration_7d'
        else if (daysUntilExpiration === 5) notificationType = 'expiration_5d'
        else if (daysUntilExpiration === 3) notificationType = 'expiration_3d'
        else if (daysUntilExpiration === 2) notificationType = 'expiration_2d'
        else if (daysUntilExpiration === 0) notificationType = 'expiration_today'

        if (!notificationType) continue

        // Verificar se já foi enviado
        const { data: alreadySent } = await supabase
            .from('notification_log')
            .select('id')
            .eq('transaction_id', transaction.id)
            .eq('notification_type', notificationType)
            .single()

        if (alreadySent) continue

        // Buscar template
        const template = templates.find((t: NotificationTemplate) => t.notification_type === notificationType)
        if (!template) continue

        // Verificar horário do template
        if (template.schedule_hour !== undefined && template.schedule_hour !== null) {
            const currentHour = new Date().getHours()
            if (currentHour !== template.schedule_hour) {
                console.log(`[CRON] Skipping ${notificationType}: scheduled for ${template.schedule_hour}h, current is ${currentHour}h`)
                continue
            }
        }

        processed++

        // Verificar se cliente tem telefone
        const client = transaction.clients
        if (!client || !client.phone) {
            await logNotification(supabase, {
                companyId,
                clientId: client?.id || transaction.client_id,
                transactionId: transaction.id,
                notificationType,
                status: 'failed',
                errorMessage: 'Cliente sem telefone cadastrado'
            })
            errors++
            continue
        }

        // Enviar notificação
        try {
            await sendWhatsAppNotification(
                supabase,
                companyId,
                client.phone,
                template.message_template,
                {
                    cliente_nome: client.name,
                    cashback_valor: transaction.cashback_value.toFixed(2),
                    dias_restantes: daysUntilExpiration.toString(),
                    data_vencimento: expirationDate.toLocaleDateString('pt-BR')
                }
            )

            await logNotification(supabase, {
                companyId,
                clientId: client.id,
                transactionId: transaction.id,
                notificationType,
                status: 'sent'
            })

            sent++
        } catch (error: any) {
            await logNotification(supabase, {
                companyId,
                clientId: client.id,
                transactionId: transaction.id,
                notificationType,
                status: 'failed',
                errorMessage: error.message
            })
            errors++
        }
    }

    return { processed, sent, errors }
}

async function sendWhatsAppNotification(
    supabase: any,
    companyId: string,
    phone: string,
    template: string,
    variables: Record<string, string>
) {
    // Buscar info da empresa
    const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

    // Substituir variáveis
    let message = template
    message = message.replace(/{cliente_nome}/g, variables.cliente_nome || '')
    message = message.replace(/{cashback_valor}/g, variables.cashback_valor || '0.00')
    message = message.replace(/{dias_restantes}/g, variables.dias_restantes || '0')
    message = message.replace(/{data_vencimento}/g, variables.data_vencimento || '')
    message = message.replace(/{empresa_nome}/g, company?.name || '')

    // Limpar telefone
    const cleanPhone = phone.replace(/\D/g, '')

    // Enviar via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evolutionUrl || !evolutionKey) {
        throw new Error('Evolution API não configurada')
    }

    const response = await fetch(`${evolutionUrl}/message/sendText/${companyId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey
        },
        body: JSON.stringify({
            number: cleanPhone,
            text: message
        })
    })

    if (!response.ok) {
        throw new Error(`Evolution API error: ${response.statusText}`)
    }
}

async function logNotification(
    supabase: any,
    data: {
        companyId: string
        clientId: string
        transactionId: string
        notificationType: string
        status: string
        errorMessage?: string
    }
) {
    await supabase.from('notification_log').insert({
        company_id: data.companyId,
        client_id: data.clientId,
        transaction_id: data.transactionId,
        notification_type: data.notificationType,
        status: data.status,
        error_message: data.errorMessage,
        sent_at: new Date().toISOString()
    })
}
