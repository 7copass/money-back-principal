
import { User, UserRole, Company, CompanyPlan, Transaction, Campaign, Client, AreaOfActivity, AdvancedFilters, ClientAnalytics, TransactionDetailed, RFMData, RFMClient } from './types';
import { supabase } from './supabaseClient';
import { sendWelcomeEmail, sendCashbackEmail, sendCashbackRedeemedEmail } from './src/services/emailService';

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

    // 2.1 MÉTRICAS DO DASHBOARD DO GESTOR
    getManagerMetrics: async () => {
        // Busca todas as empresas
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('*');

        if (companiesError) throw new Error(companiesError.message);

        // Busca todas as transações (para calcular atividade)
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('company_id, purchase_date, cashback_value, status, created_at');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        // 1. MRR (Monthly Recurring Revenue)
        const starterClients = (companies || []).filter(c => c.plan === 'Starter').length;
        const growthClients = (companies || []).filter(c => c.plan === 'Growth' || c.plan === 'Premium').length;
        const mrr = (starterClients * 297) + (growthClients * 397);
        const mrrLastMonth = mrr; // Simplificado - em produção, buscar histórico

        // 2. ARR (Annual Recurring Revenue)
        const arr = mrr * 12;

        // 3. Breakdown por plano
        const starterRevenue = starterClients * 297;
        const growthRevenue = growthClients * 397;

        // 4. Clientes Inativos (sem transação nos últimos 15 dias)
        const days15Ago = new Date(today);
        days15Ago.setDate(today.getDate() - 15);

        const companiesWithRecentActivity = new Set(
            (allTransactions || [])
                .filter(t => new Date(t.purchase_date) >= days15Ago)
                .map(t => t.company_id)
        );

        const inactiveCompanies = (companies || []).filter(c => !companiesWithRecentActivity.has(c.id));

        // 5. Taxa de Ativação (ativos nos últimos 30 days)
        const days30Ago = new Date(today);
        days30Ago.setDate(today.getDate() - 30);

        const companiesWithActivity30Days = new Set(
            (allTransactions || [])
                .filter(t => new Date(t.purchase_date) >= days30Ago)
                .map(t => t.company_id)
        );

        const activeCompanies = (companies || []).filter(c => companiesWithActivity30Days.has(c.id));
        const activationRate = (companies || []).length > 0
            ? (activeCompanies.length / companies.length) * 100
            : 0;

        // 6. Transações Processadas no Mês
        const monthTransactions = (allTransactions || []).filter(t => {
            const tDate = new Date(t.purchase_date);
            return tDate >= startOfMonth;
        });

        // 7. Taxa de Resgate Média
        const totalCashback = (allTransactions || []).reduce((sum, t) => sum + (t.cashback_value || 0), 0);
        const redeemedCashback = (allTransactions || [])
            .filter(t => t.status === 'Resgatado')
            .reduce((sum, t) => sum + Math.abs(t.cashback_value || 0), 0);
        const redeemRate = totalCashback > 0 ? (redeemedCashback / totalCashback) * 100 : 0;

        // 8. Novos Clientes no Mês
        const newCompaniesThisMonth = (companies || []).filter(c => {
            if (!c.created_at) return false;
            const createdDate = new Date(c.created_at);
            return createdDate >= startOfMonth;
        });

        // 9. MRR Growth (comparação com mês anterior)
        const mrrGrowth = mrrLastMonth > 0 ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100 : 0;

        return {
            mrr,
            mrrGrowth,
            arr,
            starterClients,
            starterRevenue,
            growthClients,
            growthRevenue,
            totalClients: (companies || []).length,
            activeClients: activeCompanies.length,
            inactiveClients: inactiveCompanies.length,
            inactiveCompaniesList: inactiveCompanies.map(c => ({
                id: c.id,
                name: c.name,
                plan: c.plan,
                totalCashbackGenerated: c.total_cashback_generated,
                activeClients: c.active_clients
            })),
            activationRate,
            monthTransactions: monthTransactions.length,
            redeemRate,
            newClientsThisMonth: newCompaniesThisMonth.length,
            totalCashbackGenerated: totalCashback,
            totalCashbackRedeemed: redeemedCashback,
            // Mapa de atividade por empresa (para tabela)
            companyActivity: (companies || []).map(c => {
                const companyTransactions = (allTransactions || []).filter(t => t.company_id === c.id);
                const lastTransaction = companyTransactions.length > 0
                    ? new Date(Math.max(...companyTransactions.map(t => new Date(t.purchase_date).getTime())))
                    : null;
                const monthTrans = companyTransactions.filter(t => new Date(t.purchase_date) >= startOfMonth).length;

                return {
                    companyId: c.id,
                    lastTransactionDate: lastTransaction,
                    monthTransactionsCount: monthTrans,
                    isActive: companiesWithActivity30Days.has(c.id)
                };
            })
        };
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

        // Limit to last 100 transactions for performance
        const { data: transactionsData } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId)
            .order('purchase_date', { ascending: false })
            .limit(100);

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

        // Usa RPC segura para buscar usuários da empresa (contorna RLS)
        const { data: usersData } = await supabase.rpc('get_company_team', { company_id_input: companyId });
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

    // 3.1 MÉTRICAS DO DASHBOARD
    getDashboardMetrics: async (companyId: string) => {
        // Busca todas as transações da empresa
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId);

        if (!transactions || transactions.length === 0) {
            return {
                bonusGerado: 0,
                ticketsGerados: 0,
                valorVendas: 0,
                bonusResgatado: 0,
                ticketsResgatados: 0,
                percentualResgatado: 0,
                bonusPerdido: 0,
                ticketsPerdidos: 0,
                percentualPerdido: 0,
                bonusAVencer: 0,
                ticketsAVencer: 0,
                transacoesPerdidas: [],
                transacoesAVencer: []
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera horas para comparação correta

        // 1. BÔNUS GERADO (todas as transações)
        const bonusGerado = transactions.reduce((sum, t) => sum + (t.cashback_value || 0), 0);
        const ticketsGerados = transactions.length;
        const valorVendas = transactions.reduce((sum, t) => sum + (t.purchase_value || 0), 0);

        // 2. BÔNUS RESGATADO (status = 'Resgatado')
        const resgatados = transactions.filter(t => t.status === 'Resgatado');
        const bonusResgatado = resgatados.reduce((sum, t) => sum + Math.abs(t.cashback_value || 0), 0);
        const ticketsResgatados = resgatados.length;
        const percentualResgatado = bonusGerado > 0 ? (bonusResgatado / bonusGerado) * 100 : 0;

        // 3. BÔNUS PERDIDO (data de expiração já passou e status ainda é 'Disponível')
        const perdidos = transactions.filter(t => {
            if (!t.cashback_expiration_date || t.status !== 'Disponível') return false;
            const expDate = new Date(t.cashback_expiration_date);
            expDate.setHours(0, 0, 0, 0);
            return expDate < today;
        });

        const bonusPerdido = perdidos.reduce((sum, t) => sum + (t.cashback_value || 0), 0);
        const ticketsPerdidos = perdidos.length;
        const percentualPerdido = bonusGerado > 0 ? (bonusPerdido / bonusGerado) * 100 : 0;

        // 4. BÔNUS A VENCER (expira em até 60 dias e status 'Disponível')
        const in60Days = new Date(today);
        in60Days.setDate(today.getDate() + 60);

        const aVencer = transactions.filter(t => {
            if (!t.cashback_expiration_date || t.status !== 'Disponível') return false;
            const expDate = new Date(t.cashback_expiration_date);
            expDate.setHours(0, 0, 0, 0);
            return expDate >= today && expDate <= in60Days;
        });
        const bonusAVencer = aVencer.reduce((sum, t) => sum + (t.cashback_value || 0), 0);
        const ticketsAVencer = aVencer.length;

        // Granular Expiration Buckets
        const getExpiringInDays = (days: number) => {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);
            return aVencer.filter(t => {
                const expDate = new Date(t.cashback_expiration_date);
                expDate.setHours(0, 0, 0, 0);
                return expDate.getTime() === targetDate.getTime();
            });
        };

        const expiringToday = getExpiringInDays(0);
        const expiringIn1Day = getExpiringInDays(1);
        const expiringIn2Days = getExpiringInDays(2);
        const expiringIn3Days = getExpiringInDays(3);
        const expiringIn5Days = getExpiringInDays(5);
        const expiringIn7Days = getExpiringInDays(7);

        return {
            bonusGerado,
            ticketsGerados,
            valorVendas,
            bonusResgatado,
            ticketsResgatados,
            percentualResgatado,
            bonusPerdido,
            ticketsPerdidos,
            percentualPerdido,
            bonusAVencer,
            ticketsAVencer,
            expiringBuckets: {
                today: { count: expiringToday.length, value: expiringToday.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
                in1Day: { count: expiringIn1Day.length, value: expiringIn1Day.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
                in2Days: { count: expiringIn2Days.length, value: expiringIn2Days.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
                in3Days: { count: expiringIn3Days.length, value: expiringIn3Days.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
                in5Days: { count: expiringIn5Days.length, value: expiringIn5Days.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
                in7Days: { count: expiringIn7Days.length, value: expiringIn7Days.reduce((sum, t) => sum + (t.cashback_value || 0), 0) },
            },
            transacoesPerdidas: perdidos.map(t => ({
                id: t.id,
                purchaseDate: t.purchase_date,
                customerName: t.customer_name,
                cashbackValue: t.cashback_value,
                expirationDate: t.cashback_expiration_date
            })),
            transacoesAVencer: aVencer.map(t => {
                const expDate = new Date(t.cashback_expiration_date);
                expDate.setHours(0, 0, 0, 0);
                const diffTime = expDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: t.id,
                    purchaseDate: t.purchase_date,
                    customerName: t.customer_name,
                    cashbackValue: t.cashback_value,
                    expirationDate: t.cashback_expiration_date,
                    daysRemaining: diffDays,
                    clientId: t.client_id
                };
            }).sort((a, b) => a.daysRemaining - b.daysRemaining)
        };
    },

    // 4. OPERAÇÕES DE ESCRITA (WRITE)
    addCompany: async (companyData: any) => {
        // Mapeamento explícito para garantir snake_case e evitar envio de campos extras
        const payload = {
            name: companyData.name,
            plan: companyData.plan,
            cnpj: companyData.cnpj,
            email: companyData.email,
            address: companyData.address,
            phone: companyData.phone,
            responsible: companyData.responsible,
            area_of_activity: companyData.areaOfActivity, // Mapeia camelCase -> snake_case
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
        const { data, error } = await supabase.rpc('create_user_by_manager', {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            company_id: userData.companyId,
            cpf: userData.cpf
        });

        if (error) {
            console.error("Error creating user:", error);
            throw error;
        }

        return data;
    },

    updateUser: async (userId: string, userData: any) => {
        const { data, error } = await supabase.from('profiles').update(userData).eq('id', userId).select().single();
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

        // ENVIAR EMAIL DE BOAS-VINDAS
        if (data.email) {
            // Buscar nome da empresa
            const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', companyId)
                .single();
            
            const companyName = companyData?.name || 'Fidelify';
            
            // Enviar email (fire and forget)
            sendWelcomeEmail({
                to: data.email,
                name: data.name,
                companyName: companyName
            }).then(() => {
                console.log('✅ Email de boas-vindas enviado para:', data.email);
            }).catch(err => {
                console.error('❌ Erro ao enviar email de boas-vindas:', err);
            });
        }

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

    // CLIENT DETAILS & ANALYTICS
    getClientDetails: async (clientId: string) => {
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) throw clientError;
        if (!client) return null;

        return {
            id: client.id,
            companyId: client.company_id,
            name: client.name,
            cpf: client.cpf,
            phone: client.phone,
            email: client.email,
            lastPurchase: client.last_purchase,
            totalCashback: client.total_cashback,
            status: client.status as Client['status'],
            points: client.points
        };
    },

    getClientTransactions: async (clientId: string, limit: number = 50) => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('client_id', clientId)
            .order('purchase_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data || []).map((t: any) => ({
            id: t.id,
            clientId: t.client_id,
            customerName: t.customer_name,
            product: t.product,
            products_details: t.products_details, // JSONB array
            purchaseValue: t.purchase_value,
            cashbackPercentage: t.cashback_percentage,
            cashbackValue: t.cashback_value,
            purchaseDate: t.purchase_date,
            cashbackExpirationDate: t.cashback_expiration_date,
            status: t.status,
            sellerId: t.seller_id,
            sellerName: t.seller_name
        }));
    },

    getClientAnalytics: async (clientId: string) => {
        // Busca todas as transações do cliente
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('client_id', clientId);

        if (error) throw error;
        if (!transactions || transactions.length === 0) {
            return {
                totalSpent: 0,
                purchaseCount: 0,
                averageTicket: 0,
                uniqueProducts: 0,
                topProducts: [],
                cashbackGenerated: 0,
                cashbackRedeemed: 0,
                redemptionRate: 0,
                firstPurchaseDate: null,
                lastPurchaseDate: null,
                daysSinceLastPurchase: null
            };
        }

        // Cálculos
        const totalSpent = transactions.reduce((sum, t) => sum + (t.purchase_value || 0), 0);
        const purchaseCount = transactions.length;
        const averageTicket = totalSpent / purchaseCount;

        // Cashback
        const cashbackGenerated = transactions
            .filter(t => t.status !== 'Resgatado')
            .reduce((sum, t) => sum + (t.cashback_value || 0), 0);
        const cashbackRedeemed = transactions
            .filter(t => t.status === 'Resgatado')
            .reduce((sum, t) => Math.abs(t.cashback_value || 0), 0);
        const redemptionRate = cashbackGenerated > 0
            ? (cashbackRedeemed / (cashbackGenerated + cashbackRedeemed)) * 100
            : 0;

        // Produtos únicos e top products
        const productMap: Map<string, { count: number; total: number }> = new Map();

        transactions.forEach(t => {
            // Se tem products_details, usa eles
            if (t.products_details && Array.isArray(t.products_details)) {
                t.products_details.forEach((p: any) => {
                    const name = p.productName || 'Produto';
                    const existing = productMap.get(name) || { count: 0, total: 0 };
                    productMap.set(name, {
                        count: existing.count + (p.quantity || 1),
                        total: existing.total + (p.totalPrice || 0)
                    });
                });
            } else if (t.product) {
                // Fallback para campo product antigo
                const existing = productMap.get(t.product) || { count: 0, total: 0 };
                productMap.set(t.product, {
                    count: existing.count + 1,
                    total: existing.total + (t.purchase_value || 0)
                });
            }
        });

        const topProducts = Array.from(productMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const uniqueProducts = productMap.size;

        // Datas
        const sortedByDate = [...transactions].sort((a, b) =>
            new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
        );
        const firstPurchaseDate = sortedByDate[0]?.purchase_date || null;
        const lastPurchaseDate = sortedByDate[sortedByDate.length - 1]?.purchase_date || null;

        const daysSinceLastPurchase = lastPurchaseDate
            ? Math.floor((new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return {
            totalSpent,
            purchaseCount,
            averageTicket,
            uniqueProducts,
            topProducts,
            cashbackGenerated,
            cashbackRedeemed,
            redemptionRate,
            firstPurchaseDate,
            lastPurchaseDate,
            daysSinceLastPurchase
        };
    },

    getClientsAdvancedFilter: async (companyId: string, filters: any) => {
        // Busca base de clientes
        let query = supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId);

        // Filtro por cashback disponível
        if (filters.cashbackAvailableMin !== undefined) {
            query = query.gte('total_cashback', filters.cashbackAvailableMin);
        }
        if (filters.cashbackAvailableMax !== undefined) {
            query = query.lte('total_cashback', filters.cashbackAvailableMax);
        }

        // Filtro por última compra
        if (filters.lastPurchaseFrom) {
            query = query.gte('last_purchase', filters.lastPurchaseFrom);
        }
        if (filters.lastPurchaseTo) {
            query = query.lte('last_purchase', filters.lastPurchaseTo);
        }

        const { data: clients, error: clientsError } = await query;

        if (clientsError) throw clientsError;
        if (!clients || clients.length === 0) return [];

        // Se não há filtros de transação, retorna direto
        const hasTransactionFilters =
            filters.products?.length ||
            filters.categories?.length ||
            filters.totalSpentMin !== undefined ||
            filters.totalSpentMax !== undefined ||
            filters.purchaseCountMin !== undefined ||
            filters.purchaseCountMax !== undefined;

        if (!hasTransactionFilters) {
            return clients.map((c: any) => ({
                id: c.id,
                companyId: c.company_id,
                name: c.name,
                cpf: c.cpf,
                phone: c.phone,
                email: c.email,
                lastPurchase: c.last_purchase,
                totalCashback: c.total_cashback,
                status: c.status as Client['status'],
                points: c.points
            }));
        }

        // Busca transações para filtros avançados
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId)
            .in('client_id', clients.map(c => c.id));

        if (transError) throw transError;

        // Agrupa transações por cliente
        const clientTransactions: Map<string, any[]> = new Map();
        (transactions || []).forEach(t => {
            const existing = clientTransactions.get(t.client_id) || [];
            existing.push(t);
            clientTransactions.set(t.client_id, existing);
        });

        // Filtra clientes baseado em transações
        const filteredClients = clients.filter((client: any) => {
            const clientTrans = clientTransactions.get(client.id) || [];
            if (clientTrans.length === 0 && hasTransactionFilters) return false;

            // Filtro por produtos
            if (filters.products?.length) {
                const hasProduct = clientTrans.some(t => {
                    // Verifica em products_details
                    if (t.products_details && Array.isArray(t.products_details)) {
                        return t.products_details.some((p: any) =>
                            filters.products.includes(p.productName)
                        );
                    }
                    // Fallback para campo product
                    return filters.products.includes(t.product);
                });
                if (!hasProduct) return false;
            }

            // Filtro por total gasto
            if (filters.totalSpentMin !== undefined || filters.totalSpentMax !== undefined) {
                const totalSpent = clientTrans.reduce((sum, t) => sum + (t.purchase_value || 0), 0);
                if (filters.totalSpentMin !== undefined && totalSpent < filters.totalSpentMin) return false;
                if (filters.totalSpentMax !== undefined && totalSpent > filters.totalSpentMax) return false;
            }

            // Filtro por número de compras
            if (filters.purchaseCountMin !== undefined && clientTrans.length < filters.purchaseCountMin) return false;
            if (filters.purchaseCountMax !== undefined && clientTrans.length > filters.purchaseCountMax) return false;

            return true;
        });

        return filteredClients.map((c: any) => ({
            id: c.id,
            companyId: c.company_id,
            name: c.name,
            cpf: c.cpf,
            phone: c.phone,
            email: c.email,
            lastPurchase: c.last_purchase,
            totalCashback: c.total_cashback,
            status: c.status as Client['status'],
            points: c.points
        }));
    },

    // PRODUCTS CRUD
    getProducts: async (companyId: string) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            companyId: p.company_id,
            name: p.name,
            description: p.description,
            category: p.category,
            isActive: p.is_active
        }));
    },

    addProduct: async (companyId: string, productData: any) => {
        const payload = {
            company_id: companyId,
            name: productData.name,
            description: productData.description,
            category: productData.category,
            is_active: productData.isActive ?? true
        };

        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;

        return {
            id: data.id,
            companyId: data.company_id,
            name: data.name,
            description: data.description,
            category: data.category,
            isActive: data.is_active
        };
    },

    updateProduct: async (productId: string, productData: any) => {
        const payload: any = {
            name: productData.name,
            description: productData.description,
            category: productData.category,
            is_active: productData.isActive,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('products').update(payload).eq('id', productId);
        if (error) throw error;
    },

    deleteProduct: async (productId: string) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
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

    updateClientCashback: async (clientId: string, cashbackValue: number) => {
        // Busca saldo atual do cliente
        const { data: clientData } = await supabase
            .from('clients')
            .select('total_cashback')
            .eq('id', clientId)
            .single();

        const currentCashback = clientData?.total_cashback || 0;
        const newCashback = currentCashback + cashbackValue;

        // Atualiza saldo e data da última compra
        const { error } = await supabase
            .from('clients')
            .update({
                total_cashback: newCashback,
                last_purchase: new Date().toISOString()
            })
            .eq('id', clientId);

        if (error) throw error;
    },

    addTransaction: async (companyId: string, data: any) => {
        if (!data.clientId) {
            throw new Error('client_id é obrigatório para criar transação');
        }

        const payload = {
            company_id: companyId,
            client_id: data.clientId,
            seller_id: data.sellerId,
            customer_name: data.customerName,
            seller_name: data.sellerName,
            product: data.product,
            products_details: data.productsDetails || null, // JSONB array
            purchase_value: data.purchaseValue,
            cashback_percentage: data.cashbackPercentage,
            cashback_value: data.cashbackValue,
            purchase_date: data.purchaseDate,
            cashback_expiration_date: data.cashbackExpirationDate,
            status: data.status
        };

        const { data: result, error } = await supabase.from('transactions').insert([payload]).select().single();
        if (error) throw error;

        // Atualiza saldo do cliente
        await api.updateClientCashback(data.clientId, data.cashbackValue);

        // ENVIAR EMAIL DE CASHBACK RECEBIDO
        if (data.cashbackValue > 0 && data.clientId) {
            // Buscar dados do cliente
            const { data: clientData } = await supabase
                .from('clients')
                .select('name, email, total_cashback')
                .eq('id', data.clientId)
                .single();
            
            if (clientData?.email) {
                // Buscar nome da empresa
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', companyId)
                    .single();
                
                const companyName = companyData?.name || 'Fidelify';
                
                // Enviar email (fire and forget - não bloqueia)
                sendCashbackEmail({
                    to: clientData.email,
                    clientName: clientData.name,
                    cashbackAmount: data.cashbackValue,
                    cashbackBalance: clientData.total_cashback,
                    companyName: companyName
                }).then(() => {
                    console.log('✅ Email de cashback enviado para:',  clientData.email);
                }).catch(err => {
                    console.error('❌ Erro ao enviar email de cashback:', err);
                });
            }
        }

        return result as any;
    },

    triggerWebhook: async (data: any) => { console.log("Webhook trigger", data); },

    getSellerRanking: async (companyId: string) => {
        // Busca todas as transações da empresa
        const { data: transactions } = await supabase
            .from('transactions')
            .select('seller_id, seller_name, cashback_value')
            .eq('company_id', companyId);

        if (!transactions) return [];

        // Agrupa por vendedor
        const sellerMap: { [sellerId: string]: { sellerName: string; totalCashback: number; salesCount: number } } = {};

        transactions.forEach(t => {
            if (!t.seller_id) return;

            if (!sellerMap[t.seller_id]) {
                sellerMap[t.seller_id] = {
                    sellerName: t.seller_name || 'Vendedor',
                    totalCashback: 0,
                    salesCount: 0
                };
            }

            sellerMap[t.seller_id].totalCashback += t.cashback_value || 0;
            sellerMap[t.seller_id].salesCount += 1;
        });

        // Converte para array e ordena
        return Object.entries(sellerMap)
            .map(([sellerId, data]) => ({
                sellerId,
                sellerName: data.sellerName,
                totalCashback: data.totalCashback,
                salesCount: data.salesCount
            }))
            .sort((a, b) => b.totalCashback - a.totalCashback);
    },

    getCustomerRankingByPurchaseValue: async (companyId: string) => {
        // Busca todas as transações da empresa
        const { data: transactions } = await supabase
            .from('transactions')
            .select('client_id, customer_name, purchase_value')
            .eq('company_id', companyId)
            .not('client_id', 'is', null);

        if (!transactions) return [];

        // Agrupa por cliente e soma valor total de compras
        const clientMap: { [clientId: string]: { name: string; value: number } } = {};

        transactions.forEach(t => {
            if (!t.client_id) return;

            if (!clientMap[t.client_id]) {
                clientMap[t.client_id] = {
                    name: t.customer_name || 'Cliente',
                    value: 0
                };
            }

            clientMap[t.client_id].value += t.purchase_value || 0;
        });

        // Converte para array e ordena
        return Object.entries(clientMap)
            .map(([id, data]) => ({
                id,
                name: data.name,
                value: data.value
            }))
            .sort((a, b) => b.value - a.value);
    },

    getCustomerRankingByPurchaseCount: async (companyId: string) => {
        // Busca todas as transações da empresa
        const { data: transactions } = await supabase
            .from('transactions')
            .select('client_id, customer_name')
            .eq('company_id', companyId)
            .not('client_id', 'is', null);

        if (!transactions) return [];

        // Agrupa por cliente e conta número de compras
        const clientMap: { [clientId: string]: { name: string; value: number } } = {};

        transactions.forEach(t => {
            if (!t.client_id) return;

            if (!clientMap[t.client_id]) {
                clientMap[t.client_id] = {
                    name: t.customer_name || 'Cliente',
                    value: 0
                };
            }

            clientMap[t.client_id].value += 1;
        });

        // Converte para array e ordena
        return Object.entries(clientMap)
            .map(([id, data]) => ({
                id,
                name: data.name,
                value: data.value
            }))
            .sort((a, b) => b.value - a.value);
    },

    getCustomerRankingBySinglePurchase: async (companyId: string) => {
        // Busca todas as transações da empresa
        const { data: transactions } = await supabase
            .from('transactions')
            .select('client_id, customer_name, purchase_value')
            .eq('company_id', companyId)
            .not('client_id', 'is', null);

        if (!transactions) return [];

        // Agrupa por cliente e pega a maior compra individual
        const clientMap: { [clientId: string]: { name: string; value: number } } = {};

        transactions.forEach(t => {
            if (!t.client_id) return;

            if (!clientMap[t.client_id]) {
                clientMap[t.client_id] = {
                    name: t.customer_name || 'Cliente',
                    value: 0
                };
            }

            // Pega o maior valor de compra
            if ((t.purchase_value || 0) > clientMap[t.client_id].value) {
                clientMap[t.client_id].value = t.purchase_value || 0;
            }
        });

        // Converte para array e ordena
        return Object.entries(clientMap)
            .map(([id, data]) => ({
                id,
                name: data.name,
                value: data.value
            }))
            .sort((a, b) => b.value - a.value);
    },

    // Busca inteligente de clientes (aceita nome, CPF ou telefone com/sem formatação)
    searchClients: async (companyId: string, searchTerm: string) => {
        if (!searchTerm || searchTerm.trim().length < 2) return [];

        // Normaliza: remove pontos, traços, parênteses, espaços
        const normalized = searchTerm.replace(/[.\-() ]/g, '');

        try {
            // Busca por nome (parcial, case insensitive), CPF ou telefone (normalizado em ambos os lados)
            // Usamos REPLACE no SQL para normalizar CPF e telefone do banco antes de comparar
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('company_id', companyId)
                .or(`name.ilike.%${searchTerm}%,cpf.like.%${normalized}%,phone.like.%${normalized}%`)
                .limit(10);

            if (error) {
                console.error("Error searching clients:", error);
                return [];
            }

            // Filtra resultados localmente para garantir match exato em CPF/telefone normalizados
            const filtered = (data || []).filter(c => {
                const cpfNormalized = (c.cpf || '').replace(/[.\-() ]/g, '');
                const phoneNormalized = (c.phone || '').replace(/[.\-() ]/g, '');
                const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
                const cpfMatch = cpfNormalized.includes(normalized);
                const phoneMatch = phoneNormalized.includes(normalized);

                return nameMatch || cpfMatch || phoneMatch;
            });

            return filtered.map(c => ({
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
            })) as Client[];
        } catch (error) {
            console.error("Exception searching clients:", error);
            return [];
        }
    },

    findClientByPhoneOrCpf: async (companyId: string, identifier: string) => {
        // Busca por CPF ou telefone
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .or(`cpf.eq.${identifier},phone.eq.${identifier}`);

        if (error) {
            console.error("Error finding client:", error);
            return null;
        }

        if (!data || data.length === 0) return null;

        // Retorna o primeiro cliente encontrado
        const clientData = data[0];

        const client: Client = {
            id: clientData.id,
            companyId: clientData.company_id,
            name: clientData.name,
            cpf: clientData.cpf,
            phone: clientData.phone,
            email: clientData.email,
            lastPurchase: clientData.last_purchase,
            totalCashback: clientData.total_cashback,
            status: clientData.status as Client['status'],
            points: clientData.points
        };

        return { client, availableCashback: clientData.total_cashback };
    },

    redeemCashback: async (companyId: string, clientId: string, sellerId: string, sellerName: string, availableCashback: number, purchaseValue: number) => {
        // Buscar dados do cliente ANTES de zerar o saldo
        const { data: clientData } = await supabase
            .from('clients')
            .select('name, email, total_cashback')
            .eq('id', clientId)
            .single();

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

        // 3. ENVIAR EMAIL DE CONFIRMAÇÃO DE RESGATE
        if (clientData?.email) {
            // Buscar nome da empresa
            const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', companyId)
                .single();
            
            const companyName = companyData?.name || 'Fidelify';
            
            // Enviar email (fire and forget)
            sendCashbackRedeemedEmail({
                to: clientData.email,
                clientName: clientData.name,
                redeemedAmount: availableCashback,
                remainingBalance: 0, // Saldo zerado após resgate
                companyName: companyName
            }).then(() => {
                console.log('✅ Email de resgate enviado para:', clientData.email);
            }).catch(err => {
                console.error('❌ Erro ao enviar email de resgate:', err);
            });
        }

        return !transError;
    },

    // EVOLUTION API - WhatsApp Connection
    evolution: {
        // Configuração da Evolution API (usar variáveis de ambiente)
        getConfig: (companyId?: string) => {
            const isDev = import.meta.env.DEV;
            // Em desenvolvimento, usa proxy para evitar CORS
            // Em produção, usa a URL direta
            const baseUrl = isDev 
                ? '/evolution-api' 
                : (import.meta.env.VITE_EVOLUTION_API_URL || 'https://api.leaderaperformance.com.br');
            const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '';
            const prefix = import.meta.env.VITE_WHATSAPP_INSTANCE_PREFIX || 'moneyback';
            
            // DEBUG: Log para verificar se as variáveis estão carregadas
            console.log('[Evolution Config] Variables loaded:', {
                isDev,
                hasUrl: !!import.meta.env.VITE_EVOLUTION_API_URL,
                hasKey: !!import.meta.env.VITE_EVOLUTION_API_KEY,
                url: baseUrl,
                keyLength: apiKey?.length || 0
            });
            
            // Se tiver companyId, usa moneyback-{id}, senão usa moneyback-default
            const instanceName = companyId ? `${prefix}-${companyId}` : `${prefix}-default`;

            // Validação: Se não tiver API Key, lança erro claro
            if (!import.meta.env.VITE_EVOLUTION_API_KEY) {
                throw new Error('Configure a variável de ambiente: VITE_EVOLUTION_API_KEY');
            }

            return { apiUrl: baseUrl, apiKey, instanceName };
        },

        // Criar instância WhatsApp
        createInstance: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);
            console.log(`[Evolution] Creating instance: ${config.instanceName} at ${config.apiUrl}`);

            try {
                const response = await fetch(`${config.apiUrl}/instance/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': config.apiKey
                    },
                    body: JSON.stringify({
                        instanceName: config.instanceName,
                        integration: 'WHATSAPP-BAILEYS',
                        qrcode: true
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Se o erro for que a instância já existe, não é um erro fatal
                    if (response.status === 403 || (data.error && data.error.includes('already exists'))) {
                        console.log('[Evolution] Instance already exists (handled)');
                        return data;
                    }
                    console.error('[Evolution] Create error:', data);
                    throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
                }

                return data;
            } catch (error) {
                console.error('[Evolution] Error creating instance:', error);
                throw error;
            }
        },

        // Obter QR Code para conexão
        getQRCode: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);
            console.log(`[Evolution] Fetching QR Code for: ${config.instanceName}`);

            try {
                const response = await fetch(
                    `${config.apiUrl}/instance/connect/${config.instanceName}`,
                    {
                        headers: { 'apikey': config.apiKey }
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[Evolution] GetQR error:', response.status, errorText);
                    throw new Error(`Failed to get QR Code: ${response.status}`);
                }

                const data = await response.json();

                if (!data.code && !data.base64) {
                    console.error('[Evolution] Invalid QR response:', data);
                    throw new Error('QR Code data not found in response');
                }

                // Suporte para diferentes formatos de resposta da Evolution (v1/v2)
                const base64 = data.code || data.base64;

                return {
                    code: base64,
                    pairingCode: data.pairingCode,
                    count: data.count
                };
            } catch (error) {
                console.error('[Evolution] Error getting QR code:', error);
                throw error;
            }
        },

        // Verificar status da conexão
        getConnectionStatus: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);

            try {
                const response = await fetch(
                    `${config.apiUrl}/instance/connectionState/${config.instanceName}`,
                    {
                        headers: { 'apikey': config.apiKey }
                    }
                );

                if (!response.ok) {
                    // Se instância não existe, retorna desconectado
                    if (response.status === 404) {
                        return {
                            state: 'close',
                            statusReason: 'Instance not found'
                        };
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return {
                    state: data.instance?.state || 'close',
                    statusReason: data.instance?.statusReason
                };
            } catch (error) {
                console.error('Error getting connection status:', error);
                return { state: 'close', statusReason: 'Error' };
            }
        },

        // Obter informações da instância
        getInstanceInfo: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);

            try {
                const response = await fetch(
                    `${config.apiUrl}/instance/fetchInstances?instanceName=${config.instanceName}`,
                    {
                        headers: { 'apikey': config.apiKey }
                    }
                );

                if (!response.ok) {
                    return null;
                }

                const data = await response.json();
                return data[0] || null;
            } catch (error) {
                console.error('Error getting instance info:', error);
                return null;
            }
        },

        // Desconectar WhatsApp (deleta a instância completamente)
        disconnect: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);

            try {
                // Primeiro tenta fazer logout
                try {
                    await fetch(
                        `${config.apiUrl}/instance/logout/${config.instanceName}`,
                        {
                            method: 'DELETE',
                            headers: { 'apikey': config.apiKey }
                        }
                    );
                } catch (logoutError) {
                    console.log('[Evolution] Logout attempt:', logoutError);
                }

                // Depois deleta a instância completamente
                const response = await fetch(
                    `${config.apiUrl}/instance/delete/${config.instanceName}`,
                    {
                        method: 'DELETE',
                        headers: { 'apikey': config.apiKey }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('Error disconnecting:', error);
                throw error;
            }
        },

        // Deletar instância
        deleteInstance: async (companyId?: string) => {
            const config = api.evolution.getConfig(companyId);

            try {
                const response = await fetch(
                    `${config.apiUrl}/instance/delete/${config.instanceName}`,
                    {
                        method: 'DELETE',
                        headers: { 'apikey': config.apiKey }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('Error deleting instance:', error);
                throw error;
            }
        }
    },

    // NOTIFICATION SERVICES
    notifications: {
        // Get notification templates for a company
        getTemplates: async (companyId: string) => {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('company_id', companyId)
                .order('notification_type');

            if (error) throw error;
            return data || [];
        },

        // Update notification template
        updateTemplate: async (companyId: string, notificationType: string, template: string, isActive: boolean, scheduleHour?: number) => {
            const payload: any = {
                company_id: companyId,
                notification_type: notificationType,
                message_template: template,
                is_active: isActive,
                updated_at: new Date().toISOString()
            };

            if (scheduleHour !== undefined) {
                payload.schedule_hour = scheduleHour;
            }

            const { data, error } = await supabase
                .from('notification_templates')
                .upsert(payload, {
                    onConflict: 'company_id,notification_type'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Replace variables in template
        replaceVariables: (template: string, variables: any) => {
            let message = template;
            Object.keys(variables).forEach(key => {
                message = message.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
            });
            return message;
        },

        // Send WhatsApp notification via Evolution API
        sendWhatsAppNotification: async (phone: string, message: string, companyId?: string) => {
            const config = api.evolution.getConfig(companyId);

            try {
                // Format phone number (remove special characters and ensure country code)
                let cleanPhone = phone.replace(/\D/g, '');

                // Add country code (55) if not present
                if (!cleanPhone.startsWith('55')) {
                    cleanPhone = '55' + cleanPhone;
                }

                const response = await fetch(
                    `${config.apiUrl}/message/sendText/${config.instanceName}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': config.apiKey
                        },
                        body: JSON.stringify({
                            number: cleanPhone,
                            text: message
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error('Error sending WhatsApp notification:', error);
                throw error;
            }
        },

        // Log notification
        logNotification: async (
            companyId: string,
            clientId: string,
            transactionId: string,
            notificationType: string,
            status: 'sent' | 'failed',
            errorMessage?: string
        ) => {
            const { data, error } = await supabase
                .from('notification_log')
                .insert({
                    company_id: companyId,
                    client_id: clientId,
                    transaction_id: transactionId,
                    notification_type: notificationType,
                    status: status,
                    error_message: errorMessage
                })
                .select()
                .single();

            if (error && error.code !== '23505') { // Ignore duplicate error
                console.error('Error logging notification:', error);
            }
            return data;
        },

        // Check if notification already sent
        isNotificationSent: async (transactionId: string, notificationType: string) => {
            const { data, error } = await supabase
                .from('notification_log')
                .select('id')
                .eq('transaction_id', transactionId)
                .eq('notification_type', notificationType)
                .single();

            return !!data;
        },

        // Get notification history
        getNotificationHistory: async (companyId: string, limit: number = 100) => {
            const { data, error } = await supabase
                .from('notification_log')
                .select(`
                    *,
                    clients!inner(name, phone),
                    transactions!inner(cashback_value, cashback_expiration_date)
                `)
                .eq('company_id', companyId)
                .order('sent_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        },

        // Get notification settings for a company
        getSettings: async (companyId: string) => {
            const { data, error } = await supabase
                .from('companies')
                .select('notifications_enabled, notification_delay_min, notification_delay_max, notification_schedule_hour, notification_schedule_minute')
                .eq('id', companyId)
                .single();

            if (error) throw error;
            return data || {
                notifications_enabled: true,
                notification_delay_min: 30,
                notification_delay_max: 60,
                notification_schedule_hour: 9,
                notification_schedule_minute: 0
            };
        },

        // Update notification settings
        updateSettings: async (companyId: string, settings: any) => {
            console.log('[Update Settings] Company ID:', companyId);
            console.log('[Update Settings] Settings:', settings);
            
            // Primeiro, verifica se a empresa existe
            const { data: companyCheck, error: checkError } = await supabase
                .from('companies')
                .select('id, name')
                .eq('id', companyId)
                .single();
                
            console.log('[Update Settings] Company check:', { companyCheck, checkError });
            
            if (checkError || !companyCheck) {
                throw new Error(`Empresa com ID ${companyId} não encontrada no banco de dados. Erro: ${checkError?.message || 'Não encontrada'}`);
            }
            
            // Agora tenta atualizar COM o campo notification_schedule_minute
            const updateData: any = {
                notifications_enabled: settings.enabled,
                notification_delay_min: settings.delayMin,
                notification_delay_max: settings.delayMax,
                notification_schedule_hour: settings.scheduleHour
            };
            
            // Adiciona o minuto apenas se tiver valor
            const scheduleMinute = parseInt(settings.scheduleMinute);
            if (!isNaN(scheduleMinute)) {
                updateData.notification_schedule_minute = scheduleMinute;
            }
            
            let { data, error } = await supabase
                .from('companies')
                .update(updateData)
                .eq('id', companyId)
                .select();

            console.log('[Update Settings] Result:', { data, error });

            // Se deu erro de coluna não existe, tenta sem o campo
            if (error && error.message?.includes('notification_schedule_minute')) {
                console.warn('[Update Settings] Column notification_schedule_minute not found, retrying without it...');
                
                const fallbackData = {
                    notifications_enabled: settings.enabled,
                    notification_delay_min: settings.delayMin,
                    notification_delay_max: settings.delayMax,
                    notification_schedule_hour: settings.scheduleHour
                };
                
                const result = await supabase
                    .from('companies')
                    .update(fallbackData)
                    .eq('id', companyId)
                    .select();
                    
                data = result.data;
                error = result.error;
                
                console.log('[Update Settings] Fallback result:', { data, error });
            }

            if (error) throw error;
            
            // Se não atualizou nenhuma linha (isso não deveria acontecer mais)
            if (!data || data.length === 0) {
                throw new Error(`Falha ao atualizar empresa ${companyId}. A empresa foi encontrada mas o UPDATE falhou.`);
            }
            
            return data[0];
        },

        // Sleep utility for delays
        sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

        // Get random delay in milliseconds
        getRandomDelay: (minSeconds: number, maxSeconds: number) => {
            const min = minSeconds * 1000;
            const max = maxSeconds * 1000;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },


        // Process expiration notifications for a company
        // Process notifications
        processNotifications: async (companyId: string, force: boolean = false) => {
            try {
                // Get active templates
                const templates = await api.notifications.getTemplates(companyId);
                const activeTemplates = templates.filter(t => t.is_active);

                if (activeTemplates.length === 0) {
                    console.log('No active templates for company:', companyId);
                    return { processed: 0, sent: 0, errors: 0 };
                }

                // Get notification settings
                const settings = await api.notifications.getSettings(companyId);

                if (!settings.notifications_enabled && !force) {
                    console.log('Notifications disabled for company:', companyId);
                    return { processed: 0, sent: 0, errors: 0, disabled: true };
                }

                // Check schedule hour (ONLY if not forced)
                if (!force && settings.notification_schedule_hour !== undefined && settings.notification_schedule_hour !== null) {
                    const currentHour = new Date().getHours();
                    const currentMinute = new Date().getMinutes();
                    
                    // Verifica hora
                    if (currentHour !== settings.notification_schedule_hour) {
                        console.log(`Skipping notifications: Scheduled for ${settings.notification_schedule_hour}h, current is ${currentHour}h`);
                        return { processed: 0, sent: 0, errors: 0, skipped: true };
                    }
                    
                    // Verifica minuto (se configurado)
                    if (settings.notification_schedule_minute !== undefined && settings.notification_schedule_minute !== null) {
                         // Permite uma margem de erro de 5 minutos para garantir que o cron pegue
                        if (Math.abs(currentMinute - settings.notification_schedule_minute) > 5) {
                             console.log(`Skipping notifications: Scheduled for minute ${settings.notification_schedule_minute}, current is ${currentMinute}`);
                             return { processed: 0, sent: 0, errors: 0, skipped: true };
                        }
                    }
                }

                // Get company info
                const { data: company } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', companyId)
                    .single();

                // Get all available cashback transactions
                const { data: transactions, error: transError } = await supabase
                    .from('transactions')
                    .select(`
                        *,
                        clients!inner(*)
                    `)
                    .eq('company_id', companyId)
                    .eq('status', 'Disponível')
                    .not('cashback_expiration_date', 'is', null);

                if (transError) throw transError;
                if (!transactions || transactions.length === 0) {
                    return { processed: 0, sent: 0, errors: 0 };
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let processed = 0;
                let sent = 0;
                let errors = 0;

                // Process each transaction
                for (const transaction of transactions) {
                    const expirationDate = new Date(transaction.cashback_expiration_date);
                    expirationDate.setHours(0, 0, 0, 0);

                    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    // Determine notification type
                    let notificationType = null;
                    if (daysUntilExpiration === 7) notificationType = 'expiration_7d';
                    else if (daysUntilExpiration === 5) notificationType = 'expiration_5d';
                    else if (daysUntilExpiration === 3) notificationType = 'expiration_3d';
                    else if (daysUntilExpiration === 2) notificationType = 'expiration_2d';
                    else if (daysUntilExpiration === 0) notificationType = 'expiration_today';

                    if (!notificationType) continue;

                    // Check if already sent
                    const alreadySent = await api.notifications.isNotificationSent(
                        transaction.id,
                        notificationType
                    );

                    if (alreadySent) continue;

                    // Get template
                    const template = activeTemplates.find(t => t.notification_type === notificationType);
                    if (!template) continue;

                    // Check template-specific schedule hour - REMOVED to use general settings only
                    // if (!force && template.schedule_hour !== undefined && template.schedule_hour !== null) {
                    //    const currentHour = new Date().getHours();
                    //    if (currentHour !== template.schedule_hour) {
                    //        console.log(`Skipping ${notificationType}: Scheduled for ${template.schedule_hour}h, current is ${currentHour}h`);
                    //        continue;
                    //    }
                    // }

                    processed++;

                    // Check if client has phone
                    const client = transaction.clients;
                    if (!client || !client.phone) {
                        await api.notifications.logNotification(
                            companyId,
                            client?.id || transaction.client_id,
                            transaction.id,
                            notificationType,
                            'failed',
                            'Client phone not found'
                        );
                        errors++;
                        continue;
                    }

                    // Replace variables
                    const message = api.notifications.replaceVariables(template.message_template, {
                        cliente_nome: client.name,
                        cliente_cpf: client.cpf || '',
                        cashback_valor: transaction.cashback_value.toFixed(2),
                        dias_restantes: daysUntilExpiration.toString(),
                        data_vencimento: new Date(transaction.cashback_expiration_date).toLocaleDateString('pt-BR'),
                        empresa_nome: company?.name || ''
                    });

                    // Send notification
                    try {
                        await api.notifications.sendWhatsAppNotification(
                            client.phone,
                            message,
                            companyId
                        );

                        await api.notifications.logNotification(
                            companyId,
                            client.id,
                            transaction.id,
                            notificationType,
                            'sent'
                        );

                        sent++;

                        // Add random delay before next message to prevent blocks
                        if (sent < processed) { // Don't delay after the last message
                            const delay = api.notifications.getRandomDelay(
                                settings.notification_delay_min || 30,
                                settings.notification_delay_max || 60
                            );
                            console.log(`Waiting ${delay / 1000}s before next message...`);
                            await api.notifications.sleep(delay);
                        }
                    } catch (error: any) {
                        await api.notifications.logNotification(
                            companyId,
                            client.id,
                            transaction.id,
                            notificationType,
                            'failed',
                            error.message
                        );
                        errors++;
                    }
                }

                return { processed, sent, errors };
            } catch (error) {
                console.error('Error processing notifications:', error);
                throw error;
            }
        }
    },

    // 5. ANÁLISE ABC
    getABCAnalysis: async (companyId: string, startDate?: string, endDate?: string) => {
        // Define período padrão (últimos 30 dias) se não informado
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date();
        if (!startDate) start.setDate(end.getDate() - 30);

        // Ajusta horas
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // 1. Busca transações do período
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId)
            .gte('purchase_date', start.toISOString())
            .lte('purchase_date', end.toISOString());

        if (error) throw error;

        // 2. Busca TODOS os produtos cadastrados (para identificar os sem vendas)
        const { data: allProducts, error: prodError } = await supabase
            .from('products')
            .select('name')
            .eq('company_id', companyId);
            
        if (prodError) throw prodError;

        // Processa produtos vendidos
        const productMap: Map<string, { count: number; revenue: number }> = new Map();

        (transactions || []).forEach(t => {
            // Se tem products_details, usa eles (suporte a múltiplos produtos)
            if (t.products_details && Array.isArray(t.products_details)) {
                t.products_details.forEach((p: any) => {
                    const name = p.productName || 'Produto Desconhecido';
                    const existing = productMap.get(name) || { count: 0, revenue: 0 };
                    productMap.set(name, {
                        count: existing.count + (p.quantity || 1),
                        revenue: existing.revenue + (p.totalPrice || 0)
                    });
                });
            } else if (t.product) {
                // Fallback para campo product antigo (string única)
                const name = t.product;
                const existing = productMap.get(name) || { count: 0, revenue: 0 };
                productMap.set(name, {
                    count: existing.count + 1,
                    revenue: existing.revenue + (t.purchase_value || 0)
                });
            }
        });

        // Cria lista inicial com produtos vendidos
        let products = Array.from(productMap.entries())
            .map(([name, data]) => ({
                name,
                count: data.count,
                revenue: data.revenue,
                percentage: 0,
                accumulated: 0,
                class: 'C' as 'A' | 'B' | 'C' | 'Sem Vendas'
            }));

        // Adiciona produtos SEM vendas (que estão no cadastro mas não no mapa)
        const soldProductNames = new Set(products.map(p => p.name));
        
        (allProducts || []).forEach(p => {
            if (!soldProductNames.has(p.name)) {
                products.push({
                    name: p.name,
                    count: 0,
                    revenue: 0,
                    percentage: 0,
                    accumulated: 100, // Ficam no final
                    class: 'Sem Vendas'
                });
            }
        });

        // Ordena por faturamento (decrescente)
        products.sort((a, b) => b.revenue - a.revenue);

        // Calcula totais e percentuais
        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
        let accumulatedRevenue = 0;

        products = products.map(p => {
            if (p.revenue === 0) {
                return { ...p, percentage: 0, accumulated: 100, class: 'Sem Vendas' };
            }

            const percentage = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
            accumulatedRevenue += p.revenue;
            const accumulatedPercentage = totalRevenue > 0 ? (accumulatedRevenue / totalRevenue) * 100 : 0;

            // Classificação ABC
            let classification: 'A' | 'B' | 'C' | 'Sem Vendas' = 'C';
            if (accumulatedPercentage <= 80) classification = 'A';
            else if (accumulatedPercentage <= 95) classification = 'B';
            
            return {
                ...p,
                percentage,
                accumulated: accumulatedPercentage,
                class: classification
            };
        });

        return {
            products,
            totalRevenue,
            period: { start, end }
        };
    },

    // 6. ANÁLISE RFM
    getRFMAnalysis: async (companyId: string): Promise<RFMData> => {
        // 1. Busca todas as transações da empresa
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId);

        if (error) throw error;

        // 2. Busca todos os clientes
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId);

        if (clientError) throw clientError;

        // Mapa de clientes
        const clientMap = new Map<string, any>();
        clients.forEach(c => clientMap.set(c.id, c));

        // Agrupa transações por cliente
        const clientStats = new Map<string, {
            totalSpent: number;
            purchaseCount: number;
            lastPurchaseDate: Date;
        }>();

        (transactions || []).forEach(t => {
            const clientId = t.client_id;
            if (!clientId) return;

            const current = clientStats.get(clientId) || {
                totalSpent: 0,
                purchaseCount: 0,
                lastPurchaseDate: new Date(0)
            };

            const purchaseDate = new Date(t.purchase_date);
            const value = t.purchase_value || 0;

            clientStats.set(clientId, {
                totalSpent: current.totalSpent + value,
                purchaseCount: current.purchaseCount + 1,
                lastPurchaseDate: purchaseDate > current.lastPurchaseDate ? purchaseDate : current.lastPurchaseDate
            });
        });

        const today = new Date();
        const rfmClients: RFMClient[] = [];

        // Processa cada cliente
        clientStats.forEach((stats, clientId) => {
            const clientInfo = clientMap.get(clientId);
            if (!clientInfo) return;

            // Recency (dias)
            const diffTime = Math.abs(today.getTime() - stats.lastPurchaseDate.getTime());
            const recencyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Frequency
            const frequency = stats.purchaseCount;

            // Monetary
            const monetary = stats.totalSpent;

            // Scores (1-5)
            let rScore = 1;
            if (recencyDays <= 7) rScore = 5;
            else if (recencyDays <= 30) rScore = 4;
            else if (recencyDays <= 60) rScore = 3;
            else if (recencyDays <= 90) rScore = 2;

            let fScore = 1;
            if (frequency >= 10) fScore = 5;
            else if (frequency >= 6) fScore = 4;
            else if (frequency >= 4) fScore = 3;
            else if (frequency >= 2) fScore = 2;

            let mScore = 1;
            if (monetary >= 1000) mScore = 5;
            else if (monetary >= 500) mScore = 4;
            else if (monetary >= 250) mScore = 3;
            else if (monetary >= 100) mScore = 2;

            const rfmCode = `${rScore}${fScore}${mScore}`;
            let segment = 'Lost'; // Default fallback

            // Lógica de Segmentação Exata
            const champions = ['555', '554', '544', '545', '454', '455', '445'];
            const loyal = ['543', '444', '435', '355', '354', '345', '344', '335'];
            const potential = ['553', '551', '552', '541', '542', '533', '532', '531', '452', '451', '442', '441', '431', '453', '433', '432', '423', '353', '352', '351', '342', '341', '333', '323'];
            const promising = ['525', '524', '523', '522', '521', '515', '514', '513', '425', '424', '413', '414', '415', '315', '314', '313'];
            const needAttention = ['535', '534', '443', '434', '343', '334', '325', '324'];
            const aboutToSleep = ['331', '321', '312', '221', '213', '231', '241', '251', '233', '232', '223', '222', '132', '123', '122', '212', '211', '124', '121', '131', '141', '151'];
            const atRisk = ['255', '254', '245', '244', '253', '252', '243', '242', '235', '234', '225', '224', '153', '152', '145', '143', '142', '135', '134', '133', '125', '124'];
            const cantLose = ['155', '154', '144', '214', '215', '115', '114', '113'];
            const hibernating = ['332', '322', '233', '232', '223', '222', '132', '123', '122', '212', '211'];
            const lost = ['111', '112', '121', '131', '141', '151'];

            if (champions.includes(rfmCode)) segment = 'Champions';
            else if (loyal.includes(rfmCode)) segment = 'Loyal Customers';
            else if (potential.includes(rfmCode)) segment = 'Potential Loyalists';
            else if (fScore === 1 && mScore < 3) segment = 'New Customers'; // Regra especial para New Customers (F=1 e M baixo/medio)
            else if (promising.includes(rfmCode)) segment = 'Promising';
            else if (needAttention.includes(rfmCode)) segment = 'Need Attention';
            else if (aboutToSleep.includes(rfmCode)) segment = 'About to Sleep';
            else if (atRisk.includes(rfmCode)) segment = 'At Risk';
            else if (cantLose.includes(rfmCode)) segment = "Can't Lose Them";
            else if (hibernating.includes(rfmCode)) segment = 'Hibernating';
            else if (lost.includes(rfmCode)) segment = 'Lost';
            else {
                // Fallback lógico se o código não estiver mapeado (ex: combinações raras)
                if (rScore >= 4 && fScore >= 4) segment = 'Champions';
                else if (rScore >= 3 && fScore >= 3) segment = 'Loyal Customers';
                else if (rScore <= 2 && fScore >= 4) segment = 'At Risk';
                else if (rScore <= 1 && fScore >= 4) segment = "Can't Lose Them";
                else if (rScore <= 2 && fScore <= 2) segment = 'Hibernating';
                else segment = 'Potential Loyalists'; // Default seguro
            }

            rfmClients.push({
                id: clientId,
                name: clientInfo.name,
                phone: clientInfo.phone,
                email: clientInfo.email,
                lastPurchaseDate: stats.lastPurchaseDate.toISOString(),
                totalPurchases: frequency,
                totalSpent: monetary,
                recency: recencyDays,
                rScore,
                fScore,
                mScore,
                segment
            });
        });

        // Calcula estatísticas dos segmentos
        const segments: Record<string, { count: number; revenue: number; percentage: number }> = {};
        const totalRevenue = rfmClients.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalClients = rfmClients.length;

        rfmClients.forEach(c => {
            if (!segments[c.segment]) {
                segments[c.segment] = { count: 0, revenue: 0, percentage: 0 };
            }
            segments[c.segment].count++;
            segments[c.segment].revenue += c.totalSpent;
        });

        // Calcula percentuais
        Object.keys(segments).forEach(seg => {
            segments[seg].percentage = totalClients > 0 ? (segments[seg].count / totalClients) * 100 : 0;
        });

        return {
            clients: rfmClients,
            segments,
            totalRevenue,
            totalClients
        };
    },

    // 7. MÉTRICAS AVANÇADAS PARA DASHBOARD DO GESTOR
    getManagerDashboardMetrics: async (): Promise<any> => {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Busca todas as empresas
            const { data: companies, error: companiesError } = await supabase
                .from('companies')
                .select('*');

            if (companiesError) throw companiesError;

            // Busca todas as transações
            const { data: allTransactions, error: transactionsError } = await supabase
                .from('transactions')
                .select('*');

            if (transactionsError) throw transactionsError;

            // 1. MÉTRICAS FINANCEIRAS
            const starterPrice = 297;
            const premiumPrice = 397;
            
            const mrr = companies.reduce((sum, company) => {
                return sum + (company.plan === 'Premium' ? premiumPrice : starterPrice);
            }, 0);

            const arr = mrr * 12;

            // Growth Rate (comparar MRR atual com mês passado)
            // Para simplificar, vamos assumir crescimento baseado em novas empresas
            const companiesThisMonth = companies.filter((c: any) => 
                new Date(c.created_at) >= startOfMonth
            ).length;
            const companiesLastMonth = companies.filter((c: any) => 
                new Date(c.created_at) >= startOfLastMonth && new Date(c.created_at) <= endOfLastMonth
            ).length;
            
            const lastMonthMRR = (companies.length - companiesThisMonth) * ((starterPrice + premiumPrice) / 2);
            const growthRate = lastMonthMRR > 0 ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0;

            // Churn Rate - empresas que cancelaram no último mês (simplificado - não temos campo de cancelamento)
            // Vamos considerar churn = 0 por enquanto, pois não temos registro de cancelamentos
            const churnRate = 0;

            // 2. MÉTRICAS DE EMPRESAS
            const totalCompanies = companies.length;
            
            // Empresas ativas = fizeram transação nos últimos 30 dias
            const activeCompanyIds = new Set(
                allTransactions
                    .filter((t: any) => new Date(t.purchase_date) >= thirtyDaysAgo)
                    .map((t: any) => t.company_id)
            );
            
            const activeCompanies = activeCompanyIds.size;
            const inactiveCompanies = totalCompanies - activeCompanies;

            // Health Score e Empresas em Risco
            const companiesAtRisk: any[] = [];
            
            companies.forEach((company: any) => {
                const companyTransactions = allTransactions.filter((t: any) => t.company_id === company.id);
                
                if (companyTransactions.length === 0) {
                    companiesAtRisk.push({
                        id: company.id,
                        name: company.name,
                        healthScore: 10,
                        daysInactive: Math.floor((now.getTime() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24)),
                        lastTransaction: null,
                        riskLevel: 'high' as const
                    });
                    return;
                }

                // Última transação
                const lastTransaction = companyTransactions.sort((a: any, b: any) => 
                    new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
                )[0];
                
                const daysSinceLastTransaction = Math.floor(
                    (now.getTime() - new Date(lastTransaction.purchase_date).getTime()) / (1000 * 60 * 60 * 24)
                );

                // Health Score simplificado (0-100)
                let healthScore = 100;
                
                // Penaliza por inatividade
                if (daysSinceLastTransaction > 30) healthScore -= 40;
                else if (daysSinceLastTransaction > 15) healthScore -= 25;
                else if (daysSinceLastTransaction > 7) healthScore -= 10;
                
                // Penaliza por baixo volume
                const last30Days = companyTransactions.filter((t: any) => 
                    new Date(t.purchase_date) >= thirtyDaysAgo
                ).length;
                if (last30Days === 0) healthScore -= 30;
                else if (last30Days < 5) healthScore -= 15;
                
                if (healthScore < 50) {
                    companiesAtRisk.push({
                        id: company.id,
                        name: company.name,
                        healthScore,
                        daysInactive: daysSinceLastTransaction,
                        lastTransaction: lastTransaction.purchase_date,
                        riskLevel: healthScore < 30 ? 'high' : 'medium' as const
                    });
                }
            });

            // 3. MÉTRICAS DE CASHBACK
            const totalCashbackGenerated = allTransactions.reduce((sum: number, t: any) => 
                sum + (t.cashback_value || 0), 0
            );

            const redeemedTransactions = allTransactions.filter((t: any) => t.status === 'Resgatado');
            const totalCashbackRedeemed = redeemedTransactions.reduce((sum: number, t: any) => 
                sum + (t.cashback_value || 0), 0
            );

            const redemptionRate = totalCashbackGenerated > 0 
                ? (totalCashbackRedeemed / totalCashbackGenerated) * 100 
                : 0;

            const pendingCashback = allTransactions
                .filter((t: any) => t.status === 'Disponível')
                .reduce((sum: number, t: any) => sum + (t.cashback_value || 0), 0);

            const expiredCashback = allTransactions
                .filter((t: any) => t.status === 'Expirado')
                .reduce((sum: number, t: any) => sum + (t.cashback_value || 0), 0);

            const averageTicket = allTransactions.length > 0
                ? allTransactions.reduce((sum: number, t: any) => sum + (t.purchase_value || 0), 0) / allTransactions.length
                : 0;

            // 4. MÉTRICAS DE ENGAGAMENTO
            // DAU/MAU simplificado (baseado em transações, não acessos ao sistema)
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const companiesActiveToday = new Set(
                allTransactions
                    .filter((t: any) => new Date(t.purchase_date) >= todayStart)
                    .map((t: any) => t.company_id)
            ).size;

            const dau = companiesActiveToday;
            const mau = activeCompanies;
            const dauMauRatio = mau > 0 ? (dau / mau) * 100 : 0;

            // Feature Adoption (simplificado - precisaria de mais dados)
            const featureAdoption = {
                whatsappConnected: 50, // Placeholder - precisaria verificar integração
                activeCampaigns: 0, // Placeholder
                productsRegistered: 80, // Placeholder
                notificationsEnabled: 50 // Placeholder
            };

            return {
                financial: {
                    mrr,
                    arr,
                    growthRate: parseFloat(growthRate.toFixed(2)),
                    churnRate
                },
                companies: {
                    totalCompanies,
                    activeCompanies,
                    inactiveCompanies,
                    companiesAtRisk: companiesAtRisk.sort((a, b) => a.healthScore - b.healthScore)
                },
                cashback: {
                    totalGenerated: totalCashbackGenerated,
                    totalRedeemed: totalCashbackRedeemed,
                    redemptionRate: parseFloat(redemptionRate.toFixed(2)),
                    pendingCashback,
                    expiredCashback,
                    averageTicket: parseFloat(averageTicket.toFixed(2))
                },
                engagement: {
                    dau,
                    mau,
                    dauMauRatio: parseFloat(dauMauRatio.toFixed(2)),
                    featureAdoption
                },
                period: {
                    start: startOfMonth.toISOString(),
                    end: now.toISOString()
                }
            };
        } catch (error) {
            console.error('Erro ao calcular métricas do gestor:', error);
            throw error;
        }
    }
};
