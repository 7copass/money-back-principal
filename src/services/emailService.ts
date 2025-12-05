// Serviço de Email - Usa Supabase Edge Function para evitar CORS

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface EmailResponse {
  success: boolean
  error?: string
}

// Interface para email de boas-vindas
export interface WelcomeEmailData {
  to: string
  name: string
  companyName: string
}

// Interface para email de cashback recebido
export interface CashbackEmailData {
  to: string
  clientName: string
  cashbackAmount: number
  cashbackBalance: number
  companyName: string
}

// Interface para email de cashback resgatado
export interface CashbackRedeemedEmailData {
  to: string
  clientName: string
  redeemedAmount: number
  remainingBalance: number
  companyName: string
}

// Interface para email de cashback expirando
export interface CashbackExpiringEmailData {
  to: string
  clientName: string
  expiringAmount: number
  expirationDate: string
  totalBalance: number
  companyName: string
}

/**
 * Função auxiliar para chamar a Edge Function
 */
async function callEdgeFunction(type: string, to: string, data: any): Promise<EmailResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ type, to, data })
    })

    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send email'
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error calling edge function:', error)
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResponse> {
  return callEdgeFunction('welcome', data.to, data)
}

/**
 * Envia email de cashback recebido
 */
export async function sendCashbackEmail(data: CashbackEmailData): Promise<EmailResponse> {
  return callEdgeFunction('cashback_received', data.to, data)
}

/**
 * Envia email de cashback resgatado
 */
export async function sendCashbackRedeemedEmail(data: CashbackRedeemedEmailData): Promise<EmailResponse> {
  return callEdgeFunction('cashback_redeemed', data.to, data)
}

/**
 * Envia email de cashback expirando
 */
export async function sendCashbackExpiringEmail(data: CashbackExpiringEmailData): Promise<EmailResponse> {
  return callEdgeFunction('cashback_expiring', data.to, data)
}
