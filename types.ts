
export enum UserRole {
    MANAGER = 'MANAGER',
    ADM = 'ADM',
    SELLER = 'SELLER',
    USER = 'USER',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId?: string;
    loyaltyTier?: 'Diamante' | 'Platina' | 'Ouro' | 'Nenhum';
    points?: number;
    cpf?: string;
}

export enum CompanyPlan {
    STARTER = 'Starter',
    PREMIUM = 'Premium'
}

export enum AreaOfActivity {
    RETAIL = 'Varejo',
    SERVICE = 'Serviço',
    RETAIL_AND_SERVICE = 'Varejo e Serviço',
}

export interface Company {
    id: string;
    name: string;
    plan: CompanyPlan;
    cnpj: string;
    email: string;
    address: string;
    phone: string;
    responsible: string;
    areaOfActivity: AreaOfActivity;
    totalCashbackGenerated: number;
    activeClients: number;
    conversionRate: number;
    monthlySales: { month: string; sales: number }[];
}

export interface Transaction {
    id: string;
    clientId: string;
    customerName: string;
    product: string;
    purchaseValue: number;
    cashbackPercentage: number;
    cashbackValue: number;
    purchaseDate: string;
    cashbackExpirationDate: string;
    status: 'Disponível' | 'Resgatado' | 'Vencido';
    sellerId?: string;
    sellerName?: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    multiplier: number;
    startDate: string;
    endDate: string;
    minPurchaseValue: number;
    status: 'Ativa' | 'Agendada' | 'Finalizada';
}

export interface Client {
    id: string;
    companyId: string;
    name: string;
    cpf: string;
    phone: string;
    email?: string;
    lastPurchase: string;
    totalCashback: number;
    status: 'Diamante' | 'Platina' | 'Ouro' | 'Nenhum';
    points: number;
}

export interface Product {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    category?: string;
    isActive: boolean;
}

// Advanced Filters for Client Segmentation
export interface AdvancedFilters {
    products?: string[];
    categories?: string[];
    totalSpentMin?: number;
    totalSpentMax?: number;
    purchaseCountMin?: number;
    purchaseCountMax?: number;
    cashbackAvailableMin?: number;
    cashbackAvailableMax?: number;
    lastPurchaseFrom?: string;
    lastPurchaseTo?: string;
}

// Client Analytics
export interface ClientAnalytics {
    totalSpent: number;
    purchaseCount: number;
    averageTicket: number;
    uniqueProducts: number;
    topProducts: Array<{
        name: string;
        count: number;
        total: number;
    }>;
    cashbackGenerated: number;
    cashbackRedeemed: number;
    redemptionRate: number;
    firstPurchaseDate: string | null;
    lastPurchaseDate: string | null;
    daysSinceLastPurchase: number | null;
}

// Transaction with detailed products
export interface TransactionDetailed extends Transaction {
    products_details?: Array<{
        productId?: string;
        productName: string;
        quantity?: number;
        unitPrice?: number;
        totalPrice: number;
    }>;
}