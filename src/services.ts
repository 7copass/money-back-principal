
import { User, UserRole, Company, CompanyPlan, Transaction, Campaign, Client, AreaOfActivity } from './types';
import { supabase } from './supabaseClient';

// --- CORE API SERVICES ---
// Agora utilizamos RPCs (Remote Procedure Calls) para garantir estabilidade no login e evitar RLS errors.

export const api = {

    // 1. LOGIN & PERFIL (CRÍTICO)
    // Usa a função get_user_profile do banco para evitar recursão de permissões.
    getProfile: async (userId: string): Promise<User | null> => {
        // CHAMADA RPC: Isso usa a função "vacina" que criamos no SQL
        const { data: profileData, error } = await supabase.rpc('get_user_profile', { user_id_input: userId });

        if (error) {
            console.error("CRITICAL: Failed to fetch profile via RPC", error);
            return null;
        }

        if (!profileData) return null;

        // Mapeia o JSON retornado pelo banco para o tipo TypeScript User
        return {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as UserRole,
            companyId: profileData.company_id,
            loyaltyTier: profileData.loyalty_tier as User['loyaltyTier'],
            points: profileData.points,
            cpf: profileData.cpf,
        };
    },

    login: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true };
    },

    // 2. DADOS DO GESTOR
    getManagerData: async () => {
        // Busca empresas
        const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*');

        if (companiesError) throw new Error(companiesError.message);

        const companies: Company[] = (companiesData || []).map(c => ({
            id: c.id,
            name: c.name,
            plan: c.plan as CompanyPlan,
            cnpj: c.cnpj,
            email: c.email,
            address: c.address,
            phone: c.phone,
            responsible: c.responsible,
            areaOfActivity: c.area_of_activity as AreaOfActivity,
            totalCashbackGenerated: c.total_cashback_generated,
            activeClients: c.active_clients,
            conversionRate: c.conversion_rate,
            monthlySales: c.monthly_sales || [],
        }));

        // Busca usuários via RPC segura
        const { data: usersData, error: usersError } = await supabase.rpc('get_managed_users');

        if (usersError) console.error("Error getting managed users via RPC:", usersError);

        let usersMapped: (User & { companyName: string })[] = [];

        if (usersData) {
            usersMapped = usersData.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role as UserRole,
                companyId: u.company_id,
                cpf: u.cpf,
                companyName: u.company_name || 'N/A',
            }));
        }

        return {
            companies: companies,
            globalStats: {
                totalCashbackGenerated: companies.reduce((sum, c) => sum + c.totalCashbackGenerated, 0),
                cashbackVencido: 0,
                clientesAtivos: companies.reduce((sum, c) => sum + c.activeClients, 0),
                campanhasAtivas: 0,
                taxaConversaoMedia: 0,
                cashbackResgatavel: 0,
            },
            users: usersMapped,
        }
    },

    // 3. DADOS DO ADMINISTRADOR DA EMPRESA
    getAdminData: async (companyId: string) => {
        const { data: companyData } = await supabase.from('companies').select('*').eq('id', companyId).single();

        const company = companyData ? {
            id: companyData.id,
            name: companyData.name,
            plan: companyData.plan as CompanyPlan,
            cnpj: companyData.cnpj,
            email: companyData.email,
            address: companyData.address,
            phone: companyData.phone,
            responsible: companyData.responsible,
            areaOfActivity: companyData.area_of_activity as AreaOfActivity,
            totalCashbackGenerated: companyData.total_cashback_generated,
            activeClients: companyData.active_clients,
            conversionRate: companyData.conversion_rate,
            monthlySales: companyData.monthly_sales || [],
        } : null;

        const { data: clientsData } = await supabase.from('clients').select('*').eq('company_id', companyId);
        const companyClients: Client[] = (clientsData || []).map(c => ({
            id: c.id,
            companyId: c.company_id,
            name: c.name,
            cpf: c.cpf,
            phone: c.phone,
            email: c.email,
            lastPurchase: c.last_purchase,
            totalCashback: c.total_cashback,
            status: c.status as Client['status'],
            points: c.points,
        }));

        const { data: transactionsData } = await supabase.from('transactions').select('*').eq('company_id', companyId).order('purchase_date', { ascending: false });
        const companyTransactions: Transaction[] = (transactionsData || []).map(t => ({
            id: t.id,
            clientId: t.client_id,
            customerName: t.customer_name,
            product: t.product,
            purchaseValue: t.purchase_value,
            cashbackPercentage: t.cashback_percentage,
            cashbackValue: t.cashback_value,
            purchaseDate: t.purchase_date,
            cashbackExpirationDate: t.cashback_expiration_date,
            status: t.status as Transaction['status'],
            sellerId: t.seller_id,
            sellerName: t.seller_name,
        }));

        const { data: usersData } = await supabase.from('profiles').select('*').eq('company_id', companyId);
        const companyUsers: User[] = (usersData || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as UserRole,
            companyId: u.company_id,
        }));

        const { data: campaignsData } = await supabase.from('campaigns').select('*').eq('company_id', companyId);
        const companyCampaigns: Campaign[] = (campaignsData || []).map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            multiplier: c.multiplier,
            startDate: c.start_date,
            endDate: c.end_date,
            minPurchaseValue: c.min_purchase_value,
            status: c.status as Campaign['status'],
        }));

        return {
            company,
            transactions: companyTransactions,
            campaigns: companyCampaigns,
            clients: companyClients,
            users: companyUsers
        }
    },

    // 4. OPERAÇÕES DE ESCRITA
    addCompany: async (companyData: any) => {
        // FIX CRÍTICO: Criamos o payload manualmente.
        // Isso evita enviar chaves do frontend (como 'areaOfActivity' camelCase) que não existem no banco.
        const payload = {
            name: companyData.name,
            plan: companyData.plan,
            cnpj: companyData.cnpj,
            email: companyData.email,
            address: companyData.address,
            phone: companyData.phone,
            responsible: companyData.responsible,
            area_of_activity: companyData.areaOfActivity, // Mapeia a chave camelCase para snake_case
            monthly_sales: [],
            total_cashback_generated: 0,
            active_clients: 0,
            conversion_rate: 0
        };

        const { data, error } = await supabase
            .from('companies')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateCompany: async (id: string, companyData: any) => {
        const payload: any = { ...companyData };
        if (companyData.areaOfActivity) {
            payload.area_of_activity = companyData.areaOfActivity;
            delete payload.areaOfActivity;
        }
        const { data, error } = await supabase.from('companies').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    createUser: async (userData: any) => {
        // 1. Gera um ID único para o perfil
        const newId = crypto.randomUUID();

        // 2. Tenta inserir o perfil na tabela 'profiles'
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                id: newId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                company_id: userData.company_id || userData.companyId, // Aceita ambos os formatos
                cpf: userData.cpf
            }])
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar perfil de usuário:", error);
            if (error.message.includes("foreign key constraint")) {
                alert("Erro: O sistema requer que o login (Auth) seja criado primeiro. Como estamos no modo cliente, não podemos criar o login automaticamente sem deslogar você. Por favor, crie o usuário no painel 'Authentication' do Supabase primeiro e insira o UID aqui, ou use um backend real.");
            }
            throw error;
        }

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            companyId: data.company_id,
        };
    },

    updateUser: async (userId: string, userData: any) => {
        const payload: any = { ...userData };
        if (userData.companyId) {
            payload.company_id = userData.companyId;
            delete payload.companyId;
        }

        const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            companyId: data.company_id,
        };
    },

    addClient: async (companyId: string, clientData: any) => {
        const payload = {
            company_id: companyId,
            ...clientData,
            last_purchase: clientData.lastPurchase,
            total_cashback: clientData.totalCashback
        };
        delete payload.lastPurchase;
        delete payload.totalCashback;

        const { data, error } = await supabase.from('clients').insert([payload]).select().single();
        if (error) throw error;
        return { ...data, lastPurchase: data.last_purchase, totalCashback: data.total_cashback } as Client;
    },

    updateClient: async (clientId: string, clientData: any) => {
        // Mapeia camelCase para snake_case se necessário
        const payload: any = { ...clientData };
        if (clientData.lastPurchase) { payload.last_purchase = clientData.lastPurchase; delete payload.lastPurchase; }
        if (clientData.totalCashback) { payload.total_cashback = clientData.totalCashback; delete payload.totalCashback; }

        const { error } = await supabase.from('clients').update(payload).eq('id', clientId);
        if (error) throw error;
    },

    getUserData: async (userId: string) => {
        const profile = await api.getProfile(userId);
        if (!profile) throw new Error("User not found");
        return { user: profile, transactions: [], balance: 0 };
    },

    addCampaign: async (companyId: string, data: any) => {
        const payload = {
            company_id: companyId,
            name: data.name,
            description: data.description,
            multiplier: data.multiplier,
            start_date: data.startDate,
            end_date: data.endDate,
            min_purchase_value: data.minPurchaseValue,
            status: 'Ativa'
        };
        const { error } = await supabase.from('campaigns').insert([payload]);
        if (error) throw error;
        return payload as any;
    },

    updateCampaign: async (id: string, data: any) => {
        const payload: any = { ...data };
        // Map fields
        if (data.startDate) { payload.start_date = data.startDate; delete payload.startDate; }
        if (data.endDate) { payload.end_date = data.endDate; delete payload.endDate; }
        if (data.minPurchaseValue) { payload.min_purchase_value = data.minPurchaseValue; delete payload.minPurchaseValue; }

        const { error } = await supabase.from('campaigns').update(payload).eq('id', id);
        if (error) throw error;
    },

    deleteCampaign: async (id: string) => {
        const { error } = await supabase.from('campaigns').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    addTransaction: async (companyId: string, data: any) => {
        const payload = {
            company_id: companyId,
            client_id: null, // Simplificação
            seller_id: data.sellerId,
            customer_name: data.customerName,
            seller_name: data.sellerName,
            product: data.product,
            purchase_value: data.purchaseValue,
            cashback_percentage: data.cashbackPercentage,
            cashback_value: data.cashbackValue,
            purchase_date: data.purchaseDate,
            cashback_expiration_date: data.cashbackExpirationDate,
            status: data.status
        };

        const { data: result, error } = await supabase.from('transactions').insert([payload]).select().single();
        if (error) throw error;
        return result as any;
    },

    triggerWebhook: async (data: any) => { console.log("Webhook trigger", data); },

    getSellerRanking: async (companyId: string) => [],
    getCustomerRankingByPurchaseValue: async (companyId: string) => [],
    getCustomerRankingByPurchaseCount: async (companyId: string) => [],
    getCustomerRankingBySinglePurchase: async (companyId: string) => [],

    findClientByPhoneOrCpf: async (companyId: string, identifier: string) => {
        // Busca simples
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .or(`cpf.eq.${identifier},phone.eq.${identifier}`)
            .single();

        if (error || !data) return null;

        // Mapeia client
        const client: Client = {
            id: data.id,
            companyId: data.company_id,
            name: data.name,
            cpf: data.cpf,
            phone: data.phone,
            email: data.email,
            lastPurchase: data.last_purchase,
            totalCashback: data.total_cashback,
            status: data.status as Client['status'],
            points: data.points
        };

        return { client, availableCashback: data.total_cashback };
    },

    redeemCashback: async (companyId: string, clientId: string, sellerId: string, sellerName: string, availableCashback: number, purchaseValue: number) => {
        // 1. Zerar o cashback do cliente
        const { error: clientError } = await supabase
            .from('clients')
            .update({ total_cashback: 0 })
            .eq('id', clientId);

        if (clientError) return false;

        // 2. Registrar transação de resgate
        const { error: transError } = await supabase.from('transactions').insert([{
            company_id: companyId,
            client_id: clientId,
            seller_id: sellerId,
            seller_name: sellerName,
            product: 'Resgate de Cashback',
            purchase_value: purchaseValue,
            cashback_percentage: 0,
            cashback_value: -availableCashback, // Valor negativo indica uso
            purchase_date: new Date(),
            status: 'Resgatado'
        }]);

        return !transError;
    },
};
