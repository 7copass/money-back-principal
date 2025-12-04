import React, { useState, useEffect } from 'react';
import { api } from './services';
import { Card, Icons, Loader } from './components';

interface ManagerMetricsDashboardProps {
    userId: string;
}

export const ManagerMetricsDashboard: React.FC<ManagerMetricsDashboardProps> = ({ userId }) => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const data = await api.getManagerDashboardMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader className="py-12 text-brand-primary" text="Carregando métricas..." />;
    if (!metrics) return <div className="text-center py-8 text-gray-500">Não foi possível carregar as métricas.</div>;

    const { financial, companies, cashback, engagement } = metrics;

    // Helpers para determinar cores baseadas em benchmarks
    const getGrowthColor = (rate: number) => {
        if (rate >= 20) return 'text-green-600';
        if (rate >= 10) return 'text-green-500';
        if (rate >= 5) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getChurnColor = (rate: number) => {
        if (rate <= 5) return 'text-green-600';
        if (rate <= 10) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getRedemptionColor = (rate: number) => {
        if (rate >= 15) return 'text-green-600';
        if (rate >= 5) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getRiskLevelBadge = (level: 'high' | 'medium' | 'low') => {
        const config = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-green-100 text-green-800 border-green-200'
        };
        const labels = {
            high: '🔴 Alto Risco',
            medium: '⚠️ Risco Médio',
            low: '✅ Baixo Risco'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold border ${config[level]}`}>
                {labels[level]}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-6 rounded-xl text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2">📊 Métricas Avançadas SaaS</h2>
                <p className="text-white/90">Visão completa da saúde do seu negócio</p>
            </div>

            {/* SEÇÃO 1: SAÚDE FINANCEIRA */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    💰 Saúde Financeira
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* MRR */}
                    <Card className="border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">MRR</p>
                                <p className="text-xs text-gray-400">Receita Mensal</p>
                            </div>
                            <Icons.DollarSign className="text-green-500 w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            R$ {financial.mrr.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Meta: R$ 20.000/mês
                        </p>
                    </Card>

                    {/* ARR */}
                    <Card className="border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">ARR</p>
                                <p className="text-xs text-gray-400">Receita Anual</p>
                            </div>
                            <Icons.TrendingUp className="text-blue-500 w-5 h-5" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            R$ {financial.arr.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            = MRR × 12
                        </p>
                    </Card>

                    {/* Growth Rate */}
                    <Card className="border-l-4 border-l-purple-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Growth Rate</p>
                                <p className="text-xs text-gray-400">Crescimento M/M</p>
                            </div>
                            <Icons.BarChart2 className="text-purple-500 w-5 h-5" />
                        </div>
                        <p className={`text-3xl font-bold ${getGrowthColor(financial.growthRate)}`}>
                            {financial.growthRate >= 0 ? '+' : ''}{financial.growthRate}%
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {financial.growthRate >= 20 ? '🚀 Explosivo!' : financial.growthRate >= 10 ? '✅ Saudável' : financial.growthRate >= 5 ? '⚠️ Lento' : '🔴 Atenção'}
                        </p>
                    </Card>

                    {/* Churn Rate */}
                    <Card className="border-l-4 border-l-red-500">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Churn Rate</p>
                                <p className="text-xs text-gray-400">Taxa Cancelamento</p>
                            </div>
                            <Icons.AlertTriangle className="text-red-500 w-5 h-5" />
                        </div>
                        <p className={`text-3xl font-bold ${getChurnColor(financial.churnRate)}`}>
                            {financial.churnRate}%
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {financial.churnRate <= 5 ? '✅ Excelente' : financial.churnRate <= 10 ? '⚠️ Atenção' : '🔴 Crítico'}
                        </p>
                    </Card>
                </div>
            </div>

            {/* SEÇÃO 2: EMPRESAS CLIENTES */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🏢 Status das Empresas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total de Empresas</p>
                                <p className="text-4xl font-bold text-blue-600 mt-2">{companies.totalCompanies}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Icons.Building className="text-blue-600 w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Empresas Ativas</p>
                                <p className="text-4xl font-bold text-green-600 mt-2">{companies.activeCompanies}</p>
                                <p className="text-xs text-gray-500 mt-1">Usaram nos últimos 30 dias</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <Icons.CheckCircle className="text-green-600 w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Empresas Inativas</p>
                                <p className="text-4xl font-bold text-orange-600 mt-2">{companies.inactiveCompanies}</p>
                                <p className="text-xs text-gray-500 mt-1">Sem uso há +30 dias</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Icons.AlertCircle className="text-orange-600 w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Empresas em Risco */}
            {companies.companiesAtRisk.length > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-red-800 flex items-center gap-2">
                            🚨 Empresas em Risco de Churn
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                {companies.companiesAtRisk.length}
                            </span>
                        </h4>
                    </div>
                    <div className="bg-white rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Empresa</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Health Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dias Inativo</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Nível de Risco</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {companies.companiesAtRisk.map((company: any) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{company.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={`inline-flex items-center gap-1 font-bold ${company.healthScore < 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {company.healthScore}/100
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">{company.daysInactive} dias</td>
                                        <td className="px-4 py-3 text-center">{getRiskLevelBadge(company.riskLevel)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="text-xs bg-brand-primary text-white px-3 py-1 rounded hover:bg-brand-secondary font-semibold">
                                                Contatar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                            <strong>💡 Ação Recomendada:</strong> Entre em contato com estas empresas hoje mesmo. 
                            Ofereça suporte, treinamento ou incentivos para reativação.
                        </p>
                    </div>
                </Card>
            )}

            {/* SEÇÃO 3: MÉTRICAS DE CASHBACK */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    💸 Performance de Cashback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Cashback Gerado</p>
                        <p className="text-2xl font-bold text-green-600">
                            R$ {cashback.totalGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Total criado no período</p>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Taxa de Resgate</p>
                        <p className={`text-2xl font-bold ${getRedemptionColor(cashback.redemptionRate)}`}>
                            {cashback.redemptionRate}%
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {cashback.redemptionRate >= 15 ? '✅ Ótimo engajamento!' : cashback.redemptionRate >= 5 ? '⚠️ Pode melhorar' : '🔴 Crítico - Ação necessária'}
                        </p>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-600">
                            R$ {cashback.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Valor médio por transação</p>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Cashback Pendente</p>
                        <p className="text-xl font-bold text-yellow-700">
                            R$ {cashback.pendingCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">Disponível para resgate</p>
                    </Card>

                    <Card className="bg-red-50 border-red-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Cashback Expirado</p>
                        <p className="text-xl font-bold text-red-700">
                            R$ {cashback.expiredCashback.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-red-600 mt-2">Perdido por vencimento</p>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Cashback Resgatado</p>
                        <p className="text-xl font-bold text-green-700">
                            R$ {cashback.totalRedeemed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-600 mt-2">Utilizado pelos clientes</p>
                    </Card>
                </div>
            </div>

            {/* SEÇÃO 4: ENGAJAMENTO */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📈 Métricas de Engajamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">DAU</p>
                        <p className="text-2xl font-bold text-gray-900">{engagement.dau}</p>
                        <p className="text-xs text-gray-500 mt-2">Ativas hoje</p>
                    </Card>

                    <Card>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">MAU</p>
                        <p className="text-2xl font-bold text-gray-900">{engagement.mau}</p>
                        <p className="text-xs text-gray-500 mt-2">Ativas no mês</p>
                    </Card>

                    <Card>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">DAU/MAU Ratio</p>
                        <p className="text-2xl font-bold text-gray-900">{engagement.dauMauRatio}%</p>
                        <p className="text-xs text-gray-500 mt-2">Frequência de uso</p>
                    </Card>
                </div>
            </div>

            {/* Resumo de Alertas */}
            <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Icons.Bell className="w-5 h-5" />
                    Alertas Automáticos
                </h4>
                <div className="space-y-2 text-sm">
                    {companies.companiesAtRisk.length > 0 && (
                        <div className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-2 border-red-500">
                            <span>🔴</span>
                            <p><strong>{companies.companiesAtRisk.length} empresa(s)</strong> em risco de churn - Ação imediata necessária!</p>
                        </div>
                    )}
                    {cashback.redemptionRate < 5 && (
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-500">
                            <span>⚠️</span>
                            <p>Taxa de resgate muito baixa ({cashback.redemptionRate}%) - Criar campanhas para incentivar uso</p>
                        </div>
                    )}
                    {financial.growthRate < 5 && (
                        <div className="flex items-start gap-2 p-2 bg-orange-50 rounded border-l-2 border-orange-500">
                            <span>⚠️</span>
                            <p>Crescimento lento ({financial.growthRate}%) - Revisar estratégia de marketing</p>
                        </div>
                    )}
                    {companies.companiesAtRisk.length === 0 && cashback.redemptionRate >= 5 && financial.growthRate >= 5 && (
                        <div className="flex items-start gap-2 p-2 bg-green-50 rounded border-l-2 border-green-500">
                            <span>✅</span>
                            <p>Tudo funcionando bem! Continue monitorando as métricas.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
