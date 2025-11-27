export enum UserRole {
    MANAGER = 'MANAGER',
    ADM = 'ADM',
    SELLER = 'SELLER',
    USER = 'USER',
}

export enum CompanyPlan {
    STARTER = 'Starter',
    PREMIUM = 'Premium',
    ENTERPRISE = 'Enterprise',
}

export enum AreaOfActivity {
    RETAIL = 'Varejo',
    SERVICES = 'Serviços',
    FOOD = 'Alimentação',
    OTHER = 'Outros',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId?: string;
    companyName?: string;
    loyaltyTier?: string;
    points?: number;
    cpf?: string;
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
    monthlySales: { month: string; value: number }[];
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
    status: string;
    points: number;
}

export interface Transaction {
    id: string;
    clientId?: string;
    customerName: string;
    product: string;
    purchaseValue: number;
    cashbackPercentage: number;
    cashbackValue: number;
    purchaseDate: string;
    cashbackExpirationDate: string;
    status: 'Disponível' | 'Resgatado' | 'Vencido';
    sellerId: string;
    sellerName: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    multiplier: number;
    startDate: string;
    endDate: string;
    minPurchaseValue: number;
    status: 'Ativa' | 'Inativa' | 'Agendada';
}
