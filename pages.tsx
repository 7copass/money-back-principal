import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User, Company, Transaction, Campaign, Client } from './types';
import { UserRole, CompanyPlan, AreaOfActivity } from './types';
import { api } from './services';
import { Button, Card, Icons, Input, StatCard, CompanyTable, SalesChart, ClientRanking, TransactionHistory, CampaignCard, Modal, Textarea, Podium, Select } from './components';

// LOGIN PAGE
export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { success, error: authError } = await api.login(email, password);
        setLoading(false);

        if (!success) {
            if (authError && authError.includes("Invalid login credentials")) {
                setError('Email ou senha inválidos.');
            } else {
                setError('Ocorreu um erro ao tentar fazer login: ' + authError);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-darkest p-4">
            <div className="max-w-md w-full p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
                <div className="flex items-center justify-center text-brand-primary mb-8">
                    <Icons.Logo />
                    <h1 className="text-3xl font-bold ml-2">Moneyback</h1>
                </div>
                <h2 className="text-2xl font-semibold text-center text-brand-darkest mb-6">Acesse sua conta</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                        <Input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                        <Input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
            </div>
        </div>
    );
};


// DASHBOARD PAGES
const ManagerDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [data, setData] = useState<Awaited<ReturnType<typeof api.getManagerData>> | null>(null);

    useEffect(() => {
        api.getManagerData()
            .then(setData)
            .catch(err => {
                console.error("Aguardando dados do servidor...", err);
            });
    }, []);

    if (!data) return <div className="p-4 sm:p-6 text-center text-gray-500">Carregando dados do gestor...</div>;

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatCard title="Cashback Gerado" value={data.globalStats.totalCashbackGenerated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Icons.Cash} />
                <StatCard title="Cashback Vencido" value={data.globalStats.cashbackVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Icons.History} />
                <StatCard title="Clientes Ativos" value={data.globalStats.clientesAtivos.toString()} icon={Icons.Users} />
                <StatCard title="Campanhas Ativas" value={data.globalStats.campanhasAtivas.toString()} icon={Icons.Gift} />
                <StatCard title="Taxa Conversão Média" value={`${data.globalStats.taxaConversaoMedia}%`} icon={Icons.Trophy} />
                <StatCard title="Cashback Resgatável" value={data.globalStats.cashbackResgatavel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Icons.Cash} />
            </div>
            <CompanyTable companies={data.companies} />
        </main>
    );
};

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [data, setData] = useState<{ company: Company, transactions: Transaction[], clients: Client[] } | null>(null);

    useEffect(() => {
        if (user.companyId) {
            api.getAdminData(user.companyId)
                .then(setData)
                .catch(console.error);
        }
    }, [user.companyId]);

    // Calculate statistics dynamically from data
    const stats = useMemo(() => {
        if (!data) return null;

        // Total cashback generated from all transactions
        const totalCashback = data.transactions.reduce((sum, t) => sum + (t.cashbackValue || 0), 0);

        // Active clients (clients with at least one transaction)
        const clientsWithTransactions = new Set(data.transactions.map(t => t.clientId).filter(Boolean));
        const activeClients = clientsWithTransactions.size;

        // Conversion rate (clients with transactions / total clients)
        const conversionRate = data.clients.length > 0
            ? Math.round((activeClients / data.clients.length) * 100)
            : 0;

        // Monthly sales for chart (last 6 months)
        const monthlySales: { month: string; value: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            const monthTotal = data.transactions
                .filter(t => {
                    if (!t.purchaseDate) return false;
                    const tDate = new Date(t.purchaseDate);
                    const tMonthYear = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
                    return tMonthYear === monthYear;
                })
                .reduce((sum, t) => sum + (t.purchaseValue || 0), 0);

            monthlySales.push({ month: monthName, value: monthTotal });
        }

        return { totalCashback, activeClients, conversionRate, monthlySales };
    }, [data]);

    if (!data || !stats) return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="h-24 animate-pulse bg-gray-100"></Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 h-64 animate-pulse bg-gray-100"></Card>
                <Card className="h-64 animate-pulse bg-gray-100"></Card>
            </div>
        </main>
    );

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Cashback Gerado" value={stats.totalCashback.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Icons.Cash} />
                <StatCard title="Clientes Ativos" value={stats.activeClients.toString()} icon={Icons.Users} />
                <StatCard title="Taxa de Conversão" value={`${stats.conversionRate}%`} icon={Icons.Trophy} />
                <StatCard title="Plano" value={data.company.plan} icon={Icons.Building} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesChart data={stats.monthlySales} />
                </div>
                <div>
                    <ClientRanking clients={data.clients} />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Histórico de Transações</h3>
                    <span className="text-sm text-gray-500">Últimas 100 transações</span>
                </div>
                <TransactionHistory transactions={data.transactions} />
            </div>
        </main>
    );
};

const SellerDashboard: React.FC<{ user: User, onNavigate: (page: string) => void }> = ({ user, onNavigate }) => {
    return (
        <main className="p-4 sm:p-6">
            <Card className="text-center">
                <h2 className="text-2xl font-bold mb-4">Bem-vindo, {user.name}!</h2>
                <p className="text-gray-600 mb-6">Pronto para registrar um novo cashback e fidelizar um cliente?</p>
                <Button onClick={() => onNavigate('registrar')} className="inline-flex items-center">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Registrar Novo Cashback
                </Button>
            </Card>
        </main>
    );
};

const UserDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [data, setData] = useState<{ user: User, transactions: Transaction[], balance: number } | null>(null);
    useEffect(() => {
        api.getUserData(user.id).then(setData);
    }, [user.id]);

    if (!data) return (
        <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-gray-100"></Card>)}
            </div>
        </div>
    );

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <StatCard title="Saldo de Cashback" value={data.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Icons.Cash} />
                <StatCard title="Nível de Fidelidade" value={data.user.loyaltyTier || 'Nenhum'} icon={Icons.Trophy} />
                <StatCard title="Pontos" value={(data.user.points || 0).toString()} icon={Icons.Diamond} />
            </div>
            <TransactionHistory transactions={data.transactions} />
        </main>
    );
};

const HistoryPage: React.FC<{ user: User }> = ({ user }) => {
    const [data, setData] = useState<{ transactions: Transaction[] } | null>(null);
    const [filter, setFilter] = useState<'all' | Transaction['status']>('all');

    useEffect(() => {
        api.getUserData(user.id).then(data => setData({ transactions: data.transactions }));
    }, [user.id]);

    const filteredTransactions = useMemo(() => {
        if (!data) return [];
        if (filter === 'all') return data.transactions;
        return data.transactions.filter(t => t.status === filter);
    }, [data, filter]);

    const FilterButton: React.FC<{
        label: string;
        value: typeof filter;
        activeFilter: typeof filter;
        onClick: (value: typeof filter) => void;
    }> = ({ label, value, activeFilter, onClick }) => {
        const isActive = value === activeFilter;
        return (
            <button
                onClick={() => onClick(value)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${isActive
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
            >
                {label}
            </button>
        );
    };

    if (!data) return <div className="p-4 sm:p-6 text-center text-gray-500">Carregando histórico...</div>;

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold">Histórico Completo</h2>
                    <div className="flex gap-2 flex-wrap">
                        <FilterButton label="Todos" value="all" activeFilter={filter} onClick={setFilter} />
                        <FilterButton label="Disponível" value="Disponível" activeFilter={filter} onClick={setFilter} />
                        <FilterButton label="Resgatado" value="Resgatado" activeFilter={filter} onClick={setFilter} />
                        <FilterButton label="Vencido" value="Vencido" activeFilter={filter} onClick={setFilter} />
                    </div>
                </div>
                <TransactionHistory transactions={filteredTransactions} />
                {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Nenhuma transação encontrada para este filtro.
                    </div>
                )}
            </Card>
        </main>
    );
};

type RankingTab = 'sellers' | 'byValue' | 'byCount' | 'bySinglePurchase';

export const RankingPage: React.FC<{ user: User }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<RankingTab>('sellers');
    const [rankings, setRankings] = useState<{
        sellers: Awaited<ReturnType<typeof api.getSellerRanking>>;
        byValue: Awaited<ReturnType<typeof api.getCustomerRankingByPurchaseValue>>;
        byCount: Awaited<ReturnType<typeof api.getCustomerRankingByPurchaseCount>>;
        bySinglePurchase: Awaited<ReturnType<typeof api.getCustomerRankingBySinglePurchase>>;
    }>({
        sellers: [],
        byValue: [],
        byCount: [],
        bySinglePurchase: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            if (user.companyId) {
                setLoading(true);
                const [sellers, byValue, byCount, bySinglePurchase] = await Promise.all([
                    api.getSellerRanking(user.companyId),
                    api.getCustomerRankingByPurchaseValue(user.companyId),
                    api.getCustomerRankingByPurchaseCount(user.companyId),
                    api.getCustomerRankingBySinglePurchase(user.companyId),
                ]);
                setRankings({ sellers, byValue, byCount, bySinglePurchase });
                setLoading(false);
            }
        };
        fetchRankings();
    }, [user.companyId]);

    const TabButton: React.FC<{ label: string; tabName: RankingTab; }> = ({ label, tabName }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-md transition-colors ${activeTab === tabName
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        if (loading) {
            return <div className="text-center py-12 text-gray-500">Carregando ranking...</div>;
        }

        const rankingsMap = {
            sellers: {
                title: 'Pódio dos Vendedores',
                subtitle: 'Vendedores que mais geraram cashback',
                data: rankings.sellers.map(s => ({
                    id: s.sellerId,
                    name: s.sellerName,
                    value: s.totalCashback,
                    subValue: `${s.salesCount} ${s.salesCount === 1 ? 'venda' : 'vendas'}`
                })),
                formatter: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                emptyMessage: 'Não há dados de vendedores para exibir no ranking.',
            },
            byValue: {
                title: 'Pódio dos Campeões',
                subtitle: 'Clientes que mais compraram em valor',
                data: rankings.byValue,
                formatter: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                emptyMessage: 'Não há dados de clientes para exibir no ranking.',
            },
            byCount: {
                title: 'Pódio de Frequência',
                subtitle: 'Clientes com maior número de compras',
                data: rankings.byCount,
                formatter: (v: number) => `${v} ${v === 1 ? 'compra' : 'compras'}`,
                emptyMessage: 'Não há dados de clientes para exibir no ranking.',
            },
            bySinglePurchase: {
                title: 'Pódio Compra Única',
                subtitle: 'Clientes com a maior compra individual',
                data: rankings.bySinglePurchase,
                formatter: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                emptyMessage: 'Não há dados de clientes para exibir no ranking.',
            },
        };

        const current = rankingsMap[activeTab];

        return current.data.length > 0 ? (
            <div className="space-y-6 pt-6">
                <Podium
                    title={current.title}
                    subtitle={current.subtitle}
                    data={current.data}
                    valueFormatter={current.formatter as (value: string | number) => string}
                />
                {current.data.length > 3 && (
                    <Card>
                        <h3 className="text-xl font-bold mb-4">Demais Colocações</h3>
                        <ul className="space-y-2">
                            {current.data.slice(3, 10).map((item, index) => (
                                <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center">
                                        <span className="font-bold text-gray-500 w-8 text-center mr-2">{index + 4}º</span>
                                        <p className="font-semibold text-brand-darkest">{item.name}</p>
                                    </div>
                                    <p className="font-bold text-brand-secondary">{(current.formatter as (v: any) => string)(item.value)}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        ) : <div className="text-center py-12 text-gray-500">{current.emptyMessage}</div>;
    };

    return (
        <main className="p-4 sm:p-6">
            <Card>
                <h2 className="text-2xl font-bold mb-2">Central de Rankings</h2>
                <p className="text-gray-600 mb-6">Acompanhe os melhores desempenhos e engaje sua equipe e clientes.</p>
                <div className="flex flex-wrap gap-2">
                    <TabButton label="Vendedores" tabName="sellers" />
                    <TabButton label="Pódio (Valor)" tabName="byValue" />
                    <TabButton label="Pódio (Compras)" tabName="byCount" />
                    <TabButton label="Pódio (Compra Única)" tabName="bySinglePurchase" />
                </div>
                {renderContent()}
            </Card>
        </main>
    );
};

// Este arquivo contém o modal de cadastro rápido de cliente
// Copie e cole este componente ANTES do RegisterCashbackPage em pages.tsx

const ClientQuickRegisterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClientRegistered: (client: Client) => void;
    companyId: string;
    prefilledCpf?: string;
}> = ({ isOpen, onClose, onClientRegistered, companyId, prefilledCpf }) => {
    const [formData, setFormData] = useState({
        name: '',
        cpf: prefilledCpf || '',
        phone: '',
        email: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (prefilledCpf) {
            setFormData(prev => ({ ...prev, cpf: prefilledCpf }));
        }
    }, [prefilledCpf]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;

        setSaving(true);
        try {
            const newClient = await api.addClient(companyId, {
                ...formData,
                status: 'Nenhum',
                points: 0,
                totalCashback: 0,
                lastPurchase: new Date().toISOString()
            });
            onClientRegistered(newClient);
            setFormData({ name: '', cpf: '', phone: '', email: '' });
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert("Erro ao cadastrar cliente. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Cadastro Rápido de Cliente</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Nome Completo</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">CPF</label>
                        <Input
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            required
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Telefone</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="(11) 98765-4321"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-gray-400 hover:bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving} className="flex-1">
                            {saving ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const RegisterCashbackPage: React.FC<{ user: User }> = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    // Client search states
    const [searchTerm, setSearchTerm] = useState('');
    const [foundClient, setFoundClient] = useState<Client | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);

    useEffect(() => {
        if (user.companyId) {
            api.getAdminData(user.companyId).then(data => {
                if (data.company) {
                    setCompanyName(data.company.name);
                }
            });
        }
    }, [user.companyId]);

    const handleSearchClient = async () => {
        if (!user.companyId || !searchTerm.trim()) return;

        setSearchPerformed(true);
        try {
            const result = await api.findClientByPhoneOrCpf(user.companyId, searchTerm.trim());
            if (result) {
                setFoundClient(result.client);
            } else {
                setFoundClient(null);
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            setFoundClient(null);
        }
    };

    const handleClientRegistered = (client: Client) => {
        setFoundClient(client);
        setShowQuickRegisterModal(false);
        setSearchPerformed(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user.companyId || !foundClient) {
            console.error("Company ID ou cliente não encontrado.");
            return;
        }
        setLoading(true);
        setSuccess(false);

        try {
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());

            const purchaseValue = parseFloat(data.value as string);
            const cashbackPercentage = parseFloat(data.cashbackPercentage as string);
            const cashbackValue = (purchaseValue * cashbackPercentage) / 100;

            const today = new Date();
            const expirationDate = new Date();
            expirationDate.setDate(today.getDate() + 30);

            await api.addTransaction(user.companyId, {
                clientId: foundClient.id,  // Using found client ID
                customerName: foundClient.name,
                customerPhone: foundClient.phone || '',
                customerEmail: foundClient.email || '',
                product: data.product as string,
                purchaseValue: purchaseValue,
                cashbackPercentage: cashbackPercentage,
                cashbackValue: cashbackValue,
                purchaseDate: today.toISOString().split('T')[0],
                cashbackExpirationDate: expirationDate.toISOString().split('T')[0],
                status: 'Disponível',
                sellerId: user.id,
                sellerName: user.name,
            });

            await api.triggerWebhook({
                event: 'cashback_generated',
                companyId: user.companyId,
                companyName: companyName,
                sellerId: user.id,
                sellerName: user.name,
                customer: {
                    name: foundClient.name,
                    phone: foundClient.phone || '',
                    email: foundClient.email || '',
                },
                purchase: {
                    product: data.product,
                    value: data.value,
                    cashbackPercentage: data.cashbackPercentage,
                    cashbackValue: cashbackValue.toFixed(2),
                }
            });

            setSuccess(true);
            if (formRef.current) formRef.current.reset();

            // Reset search states after successful registration
            setSearchTerm('');
            setFoundClient(null);
            setSearchPerformed(false);

            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error("Erro ao registrar cashback:", error);
            alert("Erro ao registrar cashback. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-4 sm:p-6 flex justify-center">
            <Card className="w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-6">Novo Registro de Cashback</h2>
                {
                    success && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                            <p className="font-bold">Sucesso!</p>
                            <p>Cashback registrado e cliente notificado via WhatsApp.</p>
                        </div>
                    )
                }

                {/* Client Search Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">1. Buscar Cliente</h3>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Busque por CPF ou Telefone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="button" onClick={handleSearchClient}>
                            🔍 Buscar
                        </Button>
                    </div>

                    {searchPerformed && foundClient && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-green-800">{foundClient.name}</p>
                                    <p className="text-sm text-green-700">CPF: {foundClient.cpf}</p>
                                    <p className="text-sm text-green-700">Telefone: {foundClient.phone}</p>
                                    {foundClient.email && <p className="text-sm text-green-700">Email: {foundClient.email}</p>}
                                </div>
                                <div className="text-green-600">
                                    ✓
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Found Message */}
                    {searchPerformed && !foundClient && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800 mb-2">Cliente não encontrado.</p>
                            <Button
                                type="button"
                                onClick={() => setShowQuickRegisterModal(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                + Cadastrar Novo Cliente
                            </Button>
                        </div>
                    )}
                </div>

                {/* Quick Register Modal */}
                <ClientQuickRegisterModal
                    isOpen={showQuickRegisterModal}
                    onClose={() => setShowQuickRegisterModal(false)}
                    onClientRegistered={handleClientRegistered}
                    companyId={user.companyId || ''}
                    prefilledCpf={searchTerm}
                />

                <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        2. Dados do Cashback
                        {!foundClient && <span className="text-sm font-normal text-gray-500">(Primeiro, busque um cliente)</span>}
                    </h3>

                    {foundClient && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 mb-4">
                            <strong>Cliente selecionado:</strong> {foundClient.name}
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="product">Produto ou Serviço</label>
                        <Input name="product" id="product" required disabled={!foundClient} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-1" htmlFor="value">Valor da Compra (R$)</label>
                            <Input name="value" id="value" type="number" step="0.01" required disabled={!foundClient} />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1" htmlFor="cashbackPercentage">% de Cashback</label>
                            <Input name="cashbackPercentage" id="cashbackPercentage" type="number" step="0.01" required disabled={!foundClient} />
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={loading || !foundClient}>
                            {loading ? 'Registrando...' : 'Gerar Cashback'}
                        </Button>
                    </div>
                </form>
            </Card >
        </main >
    )
};

export const RedeemCashbackPage: React.FC<{ user: User }> = ({ user }) => {
    const [identifier, setIdentifier] = useState('');
    const [searchResult, setSearchResult] = useState<{ client: Client, availableCashback: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [redeemSuccess, setRedeemSuccess] = useState(false);
    const [newPurchaseValue, setNewPurchaseValue] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.companyId || !identifier) return;
        setLoading(true);
        setError('');
        setSearchResult(null);
        setRedeemSuccess(false);

        const result = await api.findClientByPhoneOrCpf(user.companyId, identifier);

        if (result) {
            setSearchResult(result);
        } else {
            setError('Cliente não encontrado com o CPF ou telefone informado.');
        }
        setLoading(false);
    };

    const handleRedeem = async () => {
        if (!searchResult || !user.companyId || !newPurchaseValue) return;

        const purchaseValue = parseFloat(newPurchaseValue);
        if (isNaN(purchaseValue) || purchaseValue <= 0) {
            setError('Por favor, insira um valor de compra válido.');
            return;
        }

        if (searchResult.availableCashback > purchaseValue) {
            setError(`O valor do cashback (R$ ${searchResult.availableCashback.toFixed(2)}) não pode ser maior que o valor da nova compra.`);
            return;
        }

        setLoading(true);
        setError('');
        setRedeemSuccess(false);

        const success = await api.redeemCashback(
            user.companyId,
            searchResult.client.id,
            user.id,
            user.name,
            searchResult.availableCashback,
            purchaseValue
        );

        if (success) {
            setRedeemSuccess(true);
            setSearchResult(null); // Reset form
            setIdentifier('');
            setNewPurchaseValue('');
            setTimeout(() => setRedeemSuccess(false), 5000);
        } else {
            setError('Ocorreu um erro ao tentar resgatar o cashback. Tente novamente.');
        }
        setLoading(false);
    };

    return (
        <main className="p-4 sm:p-6 flex justify-center">
            <Card className="w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-6">Resgatar Cashback do Cliente</h2>
                {redeemSuccess && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Resgate Realizado!</p>
                        <p>O cashback foi aplicado como desconto com sucesso.</p>
                    </div>
                )}
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

                {!searchResult ? (
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label htmlFor="identifier" className="block text-gray-700 mb-1">Buscar por CPF ou Telefone</label>
                            <Input
                                id="identifier"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                placeholder="Digite o CPF ou telefone do cliente"
                                required
                            />
                        </div>
                        <div className="pt-2">
                            <Button type="submit" disabled={loading || !identifier} className="w-full">
                                {loading ? 'Buscando...' : 'Buscar Cliente'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg">{searchResult.client.name}</h3>
                            <p className="text-gray-600">CPF: {searchResult.client.cpf}</p>
                            <p className="text-gray-600">Telefone: {searchResult.client.phone}</p>
                            <div className="mt-4 text-center bg-green-100 p-3 rounded-md">
                                <p className="text-sm text-green-800">Saldo de Cashback Disponível</p>
                                <p className="text-3xl font-bold text-green-800">
                                    {searchResult.availableCashback.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>

                        {searchResult.availableCashback > 0 ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="newPurchaseValue" className="block text-gray-700 mb-1">Valor da Nova Compra (R$)</label>
                                    <Input
                                        id="newPurchaseValue"
                                        type="number"
                                        step="0.01"
                                        value={newPurchaseValue}
                                        onChange={e => setNewPurchaseValue(e.target.value)}
                                        placeholder="Ex: 150.00"
                                        required
                                    />
                                </div>
                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <Button onClick={() => setSearchResult(null)} className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                                        Buscar Outro Cliente
                                    </Button>
                                    <Button
                                        onClick={handleRedeem}
                                        disabled={loading || !newPurchaseValue}
                                        className="w-full"
                                    >
                                        {loading ? 'Processando...' : `Aplicar Desconto de ${searchResult.availableCashback.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-center text-gray-600 p-4">Este cliente não possui saldo de cashback para resgate.</p>
                                <Button onClick={() => setSearchResult(null)} className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                                    Buscar Outro Cliente
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </main>
    );
};

const CampaignFormModal: React.FC<{
    isOpen: boolean;
    onClose: (didSave?: boolean) => void;
    onSave: (campaignData: Omit<Campaign, 'id' | 'status'>) => Promise<void>;
    campaign: Campaign | null;
}> = ({ isOpen, onClose, onSave, campaign }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        multiplier: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        minPurchaseValue: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name,
                description: campaign.description,
                multiplier: campaign.multiplier,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                minPurchaseValue: campaign.minPurchaseValue,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                multiplier: 1,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                minPurchaseValue: 0,
            });
        }
    }, [campaign, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose(true); // Close and signal success
        } catch (error) {
            console.error("Failed to save campaign:", error);
            // In a real app, you'd set an error state here to show in the modal
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => onClose()} title={campaign ? 'Editar Campanha' : 'Criar Nova Campanha'}>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-gray-700 mb-1" htmlFor="name">Nome da Campanha</label>
                    <Input name="name" id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-gray-700 mb-1" htmlFor="description">Descrição</label>
                    <Textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="startDate">Data de Início</label>
                    <Input name="startDate" id="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="endDate">Data de Fim</label>
                    <Input name="endDate" id="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="multiplier">Multiplicador (ex: 2 para 2x)</label>
                    <Input name="multiplier" id="multiplier" type="number" min="1" step="0.1" value={formData.multiplier} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="minPurchaseValue">Valor Mínimo da Compra (R$)</label>
                    <Input name="minPurchaseValue" id="minPurchaseValue" type="number" step="0.01" value={formData.minPurchaseValue} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-2 pt-4 flex justify-end gap-3">
                    <Button onClick={() => onClose()} type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Campanha'}</Button>
                </div>
            </form>
        </Modal>
    );
};


export const CampaignsPage: React.FC<{ user: User }> = ({ user }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

    const fetchCampaigns = useCallback(async () => {
        if (!user.companyId) return;
        setLoading(true);
        const data = await api.getAdminData(user.companyId);
        setCampaigns(data.campaigns);
        setLoading(false);
    }, [user.companyId]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleAdd = () => {
        setEditingCampaign(null);
        setIsModalOpen(true);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsModalOpen(true);
    };

    const handleDelete = (campaign: Campaign) => {
        setDeletingCampaign(campaign);
    };

    const handleConfirmDelete = async () => {
        if (deletingCampaign) {
            await api.deleteCampaign(deletingCampaign.id);
            setDeletingCampaign(null);
            fetchCampaigns();
        }
    };

    const handleCloseModal = (didSave: boolean = false) => {
        setIsModalOpen(false);
        setEditingCampaign(null);
        if (didSave) {
            fetchCampaigns();
        }
    };

    const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'status'>) => {
        if (editingCampaign) {
            await api.updateCampaign(editingCampaign.id, campaignData);
        } else {
            if (user.companyId) {
                await api.addCampaign(user.companyId, campaignData);
            }
        }
    };

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gerenciamento de Campanhas</h1>
                <Button onClick={handleAdd} className="inline-flex items-center">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Criar Campanha
                </Button>
            </div>

            {loading && campaigns.length === 0 ? (
                <p>Carregando campanhas...</p>
            ) : campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {campaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} onEdit={handleEdit} onDelete={handleDelete} />)}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <h3 className="text-xl font-semibold">Nenhuma campanha encontrada</h3>
                    <p className="text-gray-500 mt-2">Crie sua primeira campanha para começar a engajar seus clientes!</p>
                    <Button onClick={handleAdd} className="mt-6">Criar Primeira Campanha</Button>
                </Card>
            )}

            <CampaignFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveCampaign}
                campaign={editingCampaign}
            />

            <Modal isOpen={!!deletingCampaign} onClose={() => setDeletingCampaign(null)} title="Confirmar Exclusão">
                <div>
                    <p>Tem certeza que deseja excluir a campanha <strong>{deletingCampaign?.name}</strong>? Esta ação não pode ser desfeita.</p>
                    <div className="pt-6 flex justify-end gap-3">
                        <Button onClick={() => setDeletingCampaign(null)} type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                        <Button onClick={handleConfirmDelete} className="bg-danger hover:bg-red-700">Excluir</Button>
                    </div>
                </div>
            </Modal>
        </main>
    );
};

const CompanyFormModal: React.FC<{
    isOpen: boolean;
    onClose: (didSave?: boolean) => void;
    onSave: (companyData: Pick<Company, 'name' | 'plan' | 'cnpj' | 'email' | 'address' | 'phone' | 'responsible' | 'areaOfActivity'>) => Promise<void>;
    company: Company | null;
}> = ({ isOpen, onClose, onSave, company }) => {
    const [name, setName] = useState('');
    const [plan, setPlan] = useState<CompanyPlan>(CompanyPlan.STARTER);
    const [cnpj, setCnpj] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [responsible, setResponsible] = useState('');
    const [areaOfActivity, setAreaOfActivity] = useState<AreaOfActivity>(AreaOfActivity.RETAIL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (company) {
            setName(company.name);
            setPlan(company.plan);
            setCnpj(company.cnpj);
            setEmail(company.email);
            setAddress(company.address);
            setPhone(company.phone);
            setResponsible(company.responsible);
            setAreaOfActivity(company.areaOfActivity);
        } else {
            setName('');
            setPlan(CompanyPlan.STARTER);
            setCnpj('');
            setEmail('');
            setAddress('');
            setPhone('');
            setResponsible('');
            setAreaOfActivity(AreaOfActivity.RETAIL);
        }
        setError('');
    }, [company, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSave({ name, plan, cnpj, email, address, phone, responsible, areaOfActivity });
            onClose(true);
        } catch (err: any) {
            const errorMessage = err?.message || 'Ocorreu um erro desconhecido.';

            if (errorMessage.includes('duplicate key')) {
                setError('Este CNPJ já está cadastrado.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => onClose()} title={company ? 'Editar Empresa' : 'Adicionar Nova Empresa'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md text-center font-bold">{error}</p>}
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="companyName">Nome da Empresa</label>
                    <Input id="companyName" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="cnpj">CNPJ</label>
                    <Input id="cnpj" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="address">Endereço</label>
                    <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="phone">Telefone</label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1" htmlFor="responsible">Responsável</label>
                    <Input id="responsible" value={responsible} onChange={e => setResponsible(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="plan">Plano</label>
                        <Select id="plan" value={plan} onChange={e => setPlan(e.target.value as CompanyPlan)}>
                            {Object.values(CompanyPlan).map((p) => <option key={p as string} value={p as string}>{p as string}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1" htmlFor="areaOfActivity">Área de Atuação</label>
                        <Select id="areaOfActivity" value={areaOfActivity} onChange={e => setAreaOfActivity(e.target.value as AreaOfActivity)}>
                            {Object.values(AreaOfActivity).map((a) => <option key={a as string} value={a as string}>{a as string}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => onClose()} type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Empresa'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export const CompaniesPage: React.FC<{ user: User }> = ({ user }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getManagerData();
            setCompanies(data.companies);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const handleCloseModal = (didSave: boolean = false) => {
        setIsModalOpen(false);
        setEditingCompany(null);
        if (didSave) {
            fetchCompanies();
        }
    };

    const handleSaveCompany = async (companyData: any) => {
        if (editingCompany) {
            await api.updateCompany(editingCompany.id, companyData);
        } else {
            await api.addCompany(companyData);
        }
    };

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
                <Button onClick={handleAdd} className="inline-flex items-center self-start sm:self-center">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Adicionar Empresa
                </Button>
            </div>

            {loading && companies.length === 0 ? (
                <p>Carregando empresas...</p>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-2 sm:p-4">Empresa</th>
                                    <th className="p-2 sm:p-4">Plano</th>
                                    <th className="p-2 sm:p-4">Responsável</th>
                                    <th className="p-2 sm:p-4">Contato</th>
                                    <th className="p-2 sm:p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map(c => (
                                    <tr key={c.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 sm:p-4 font-semibold">{c.name}<br /><span className="text-xs text-gray-500 font-normal">{c.cnpj}</span></td>
                                        <td className="p-2 sm:p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.plan === 'Premium' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{c.plan}</span></td>
                                        <td className="p-2 sm:p-4">{c.responsible}</td>
                                        <td className="p-2 sm:p-4">{c.email}<br />{c.phone}</td>
                                        <td className="p-2 sm:p-4">
                                            <button onClick={() => handleEdit(c)} className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg">
                                                <Icons.Edit className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <CompanyFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveCompany}
                company={editingCompany}
            />
        </main>
    );
};

const ClientFormModal: React.FC<{
    isOpen: boolean;
    onClose: (didSave?: boolean) => void;
    onSave: (clientData: any) => Promise<void>;
    client: Client | null;
}> = ({ isOpen, onClose, onSave, client }) => {
    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        phone: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                cpf: client.cpf,
                phone: client.phone,
                email: client.email || '',
            });
        } else {
            setFormData({ name: '', cpf: '', phone: '', email: '' });
        }
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose(true);
    };

    return (
        <Modal isOpen={isOpen} onClose={() => onClose()} title={client ? 'Editar Cliente' : 'Novo Cliente'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">Nome</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">CPF</label>
                    <Input name="cpf" value={formData.cpf} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Telefone</label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Email</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => onClose()} type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export const ClientsPage: React.FC<{ user: User }> = ({ user }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const fetchClients = useCallback(async () => {
        if (!user.companyId) return;
        setLoading(true);
        try {
            const data = await api.getAdminData(user.companyId);
            setClients(data.clients);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user.companyId]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleAdd = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (!user.companyId) return;
        if (editingClient) {
            await api.updateClient(editingClient.id, data);
        } else {
            await api.addClient(user.companyId, { ...data, status: 'Nenhum', points: 0, totalCashback: 0, lastPurchase: new Date().toISOString() });
        }
    };

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
                <Button onClick={handleAdd} className="inline-flex items-center">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Adicionar Cliente
                </Button>
            </div>
            {loading ? <p>Carregando...</p> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">CPF</th>
                                    <th className="p-3">Telefone</th>
                                    <th className="p-3">Tier</th>
                                    <th className="p-3">Pontos</th>
                                    <th className="p-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(c => (
                                    <tr key={c.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-semibold">{c.name}</td>
                                        <td className="p-3">{c.cpf}</td>
                                        <td className="p-3">{c.phone}</td>
                                        <td className="p-3">{c.status}</td>
                                        <td className="p-3">{c.points}</td>
                                        <td className="p-3">
                                            <button onClick={() => handleEdit(c)} className="text-brand-primary hover:bg-brand-primary/10 p-2 rounded">
                                                <Icons.Edit className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <ClientFormModal isOpen={isModalOpen} onClose={(saved) => { setIsModalOpen(false); if (saved) fetchClients(); }} onSave={handleSave} client={editingClient} />
        </main>
    );
};

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: (didSave?: boolean) => void;
    onSave: (userData: any) => Promise<void>;
    user: User | null;
    roles: UserRole[];
    isCreating: boolean;
    companies?: Company[];
}> = ({ isOpen, onClose, onSave, user, roles, isCreating, companies }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: roles[0],
        cpf: '',
        companyId: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                cpf: user.cpf || '',
                companyId: user.companyId || '',
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: roles[0],
                cpf: '',
                companyId: '',
            });
        }
    }, [user, isOpen, roles]);

    // Lógica para pré-selecionar empresa ou limpar se for Gestor
    useEffect(() => {
        // Se ainda não tiver empresa selecionada e houver empresas, seleciona a primeira
        if (!formData.companyId && companies && companies.length > 0) {
            setFormData(prev => ({ ...prev, companyId: companies[0].id }));
        }
    }, [companies, formData.companyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose(true);
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar usuário. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    const isManager = formData.role === UserRole.MANAGER;
    const canShowCompanies = companies && companies.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={() => onClose()} title={isCreating ? 'Adicionar Novo Usuário' : 'Editar Usuário'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">Nome Completo</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Email (Login)</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={!isCreating} />
                </div>
                {isCreating && (
                    <div>
                        <label className="block text-gray-700 mb-1">Senha (para acesso futuro)</label>
                        <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
                        <p className="text-xs text-gray-500 mt-1">Crie uma senha que o usuário usará para entrar.</p>
                    </div>
                )}
                <div>
                    <label className="block text-gray-700 mb-1">CPF (Opcional)</label>
                    <Input name="cpf" value={formData.cpf} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-gray-700 mb-1">Cargo / Função</label>
                    <Select name="role" value={formData.role} onChange={handleChange}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                </div>

                {canShowCompanies && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <label className="block text-brand-darkest font-bold mb-1">Vincular à Empresa</label>
                        <Select name="companyId" value={formData.companyId} onChange={handleChange} required>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <p className="text-xs text-gray-600 mt-1">
                            Administradores e Vendedores precisam estar vinculados a uma empresa.
                        </p>
                    </div>
                )}

                {!isManager && (!companies || companies.length === 0) && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                        Atenção: Você não tem empresas cadastradas. Cadastre uma empresa na aba "Empresas" antes de criar este tipo de usuário.
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <Button onClick={() => onClose()} type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</Button>
                    <Button type="submit" disabled={loading || (canShowCompanies && !formData.companyId)}>
                        {loading ? 'Salvando...' : 'Salvar Usuário'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export const UsersPage: React.FC<{ user: User }> = ({ user }) => {
    const [users, setUsers] = useState<(User & { companyName?: string })[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        api.getManagerData().then(data => {
            setUsers(data.users);
            setCompanies(data.companies);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (u: User) => {
        setEditingUser(u);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (editingUser) {
            await api.updateUser(editingUser.id, {
                name: data.name,
                role: data.role,
                companyId: data.companyId
            });
        } else {
            await api.createUser({
                ...data,
                companyId: data.companyId
            });
        }
    };

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-brand-darkest">Usuários do Sistema</h1>
                    <p className="text-gray-500">Gerencie quem tem acesso ao Moneyback</p>
                </div>
                <Button onClick={handleAdd} className="inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Adicionar Novo Usuário
                </Button>
            </div>

            {loading ? <p className="text-center py-8 text-gray-500">Carregando lista de usuários...</p> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 text-gray-600 font-medium">Nome</th>
                                    <th className="p-3 text-gray-600 font-medium">Email</th>
                                    <th className="p-3 text-gray-600 font-medium">Empresa</th>
                                    <th className="p-3 text-gray-600 font-medium">Cargo</th>
                                    <th className="p-3 text-gray-600 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-semibold text-brand-darkest">{u.name}</td>
                                        <td className="p-3 text-gray-600">{u.email}</td>
                                        <td className="p-3 text-gray-600">{u.companyName}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.MANAGER ? 'bg-purple-100 text-purple-700' :
                                                u.role === UserRole.ADM ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleEdit(u)} className="text-brand-primary hover:bg-brand-primary/10 p-2 rounded transition-colors" title="Editar Usuário">
                                                <Icons.Edit className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Nenhum usuário encontrado. Clique em "Adicionar Novo Usuário" para começar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={(saved) => { setIsModalOpen(false); if (saved) fetchUsers(); }}
                onSave={handleSave}
                user={editingUser}
                roles={[UserRole.ADM, UserRole.SELLER, UserRole.MANAGER]}
                isCreating={!editingUser}
                companies={companies}
            />
        </main>
    );
};

export const PermissionsPage: React.FC<{ user: User }> = ({ user }) => {
    const [team, setTeam] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchTeam = useCallback(async () => {
        if (!user.companyId) return;
        setLoading(true);
        const data = await api.getAdminData(user.companyId);
        setTeam(data.users);
        setLoading(false);
    }, [user.companyId]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (u: User) => {
        setEditingUser(u);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (!user.companyId) return;
        if (editingUser) {
            await api.updateUser(editingUser.id, { name: data.name, role: data.role });
        } else {
            await api.createUser({ ...data, companyId: user.companyId });
        }
    };

    return (
        <main className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Permissões da Equipe</h1>
                <Button onClick={handleAdd} className="inline-flex items-center">
                    <Icons.PlusCircle className="w-5 h-5 mr-2" />
                    Adicionar Usuário
                </Button>
            </div>
            {loading ? <p>Carregando...</p> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Cargo</th>
                                    <th className="p-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-semibold">{u.name}</td>
                                        <td className="p-3">{u.email}</td>
                                        <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                                        <td className="p-3">
                                            <button onClick={() => handleEdit(u)} className="text-brand-primary hover:bg-brand-primary/10 p-2 rounded">
                                                <Icons.Edit className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={(saved) => { setIsModalOpen(false); if (saved) fetchTeam(); }}
                onSave={handleSave}
                user={editingUser}
                roles={[UserRole.ADM, UserRole.SELLER]}
                isCreating={!editingUser}
            />
        </main>
    );
};

export const Dashboard: React.FC<{ user: User; onNavigate: (page: string) => void; currentPage: string }> = ({ user, onNavigate, currentPage }) => {
    switch (currentPage) {
        case 'dashboard':
            if (user.role === UserRole.MANAGER) return <ManagerDashboard user={user} />;
            if (user.role === UserRole.ADM) return <AdminDashboard user={user} />;
            if (user.role === UserRole.SELLER) return <SellerDashboard user={user} onNavigate={onNavigate} />;
            if (user.role === UserRole.USER) return <UserDashboard user={user} />;
            return <div>Role unknown</div>;
        case 'empresas':
            return <CompaniesPage user={user} />;
        case 'usuarios':
            return <UsersPage user={user} />;
        case 'clientes':
            return <ClientsPage user={user} />;
        case 'campanhas':
            return <CampaignsPage user={user} />;
        case 'permissoes':
            return <PermissionsPage user={user} />;
        case 'registrar':
            return <RegisterCashbackPage user={user} />;
        case 'resgatar':
            return <RedeemCashbackPage user={user} />;
        case 'historico':
            return <HistoryPage user={user} />;
        case 'ranking':
            return <RankingPage user={user} />;
        default:
            return <div>Página não encontrada</div>;
    }
};
