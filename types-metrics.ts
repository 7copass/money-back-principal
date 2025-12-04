/**
 * Interfaces para métricas avançadas do Dashboard de Gestor (Manager)
 */

// Métricas de saúde financeira
export interface FinancialHealthMetrics {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    growthRate: number; // Taxa de crescimento mensal (%)
    churnRate: number; // Taxa de cancelamento (%)
}

// Métricas de empresas clientes
export interface CompanyMetrics {
    totalCompanies: number;
    activeCompanies: number; // Empresas que fizeram transação nos últimos 30 dias
    inactiveCompanies: number;
    companiesAtRisk: CompanyAtRisk[]; // Empresas em risco de churn
}

export interface CompanyAtRisk {
    id: string;
    name: string;
    healthScore: number; // 0-100
    daysInactive: number;
    lastTransaction: string;
    riskLevel: 'high' | 'medium' | 'low';
}

// Métricas de cashback
export interface CashbackMetrics {
    totalGenerated: number; // Total de cashback gerado
    totalRedeemed: number; // Total resgatado
    redemptionRate: number; // Taxa de resgate (%)
    pendingCashback: number; // Cashback disponível
    expiredCashback: number; // Cashback expirado
    averageTicket: number; // Ticket médio
}

// Métricas de engajamento
export interface EngagementMetrics {
    dau: number; // Daily Active Users
    mau: number; // Monthly Active Users
    dauMauRatio: number; // DAU/MAU ratio (%)
    featureAdoption: FeatureAdoptionMetrics;
}

export interface FeatureAdoptionMetrics {
    whatsappConnected: number; // % empresas com WhatsApp
    activeCampaigns: number; // % com campanhas ativas
    productsRegistered: number; // % com produtos cadastrados
    notificationsEnabled: number; // % com notificações ativas
}

// Métricas consolidadas para o dashboard
export interface ManagerDashboardMetrics {
    financial: FinancialHealthMetrics;
    companies: CompanyMetrics;
    cashback: CashbackMetrics;
    engagement: EngagementMetrics;
    period: {
        start: string;
        end: string;
    };
}
