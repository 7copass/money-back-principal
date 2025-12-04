import React, { useState, useEffect } from 'react';
import { Client, ClientAnalytics, TransactionDetailed } from './types';
import { api } from './services';
import { Button, Card, Icons, Modal, Loader } from './components';

interface ClientDetailsModalProps {
    client: Client | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'analytics'>('info');
    const [transactions, setTransactions] = useState<TransactionDetailed[]>([]);
    const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (client && isOpen) {
            loadData();
        }
    }, [client, isOpen]);

    const loadData = async () => {
        if (!client) return;

        setLoading(true);
        try {
            const [transactionsData, analyticsData] = await Promise.all([
                api.getClientTransactions(client.id),
                api.getClientAnalytics(client.id)
            ]);
            setTransactions(transactionsData as TransactionDetailed[]);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error loading client data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!client) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Cliente: ${client.name}`} size="4xl">
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📋 Informações
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            🛒 Histórico de Compras
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📊 Analytics
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <Loader className="py-12 text-brand-primary" />
                ) : (
                    <>
                        {/* Tab: Informações */}
                        {activeTab === 'info' && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</label>
                                        <p className="text-gray-900 font-medium mt-1">{client.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CPF</label>
                                        <p className="text-gray-900 font-medium mt-1">{client.cpf}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone</label>
                                        <p className="text-gray-900 font-medium mt-1">{client.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                        <p className="text-gray-900 font-medium mt-1">{client.email || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                            client.status === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pontos</label>
                                        <p className="text-gray-900 font-medium mt-1">{client.points}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashback Disponível</label>
                                        <p className="text-green-600 font-bold text-lg mt-1">
                                            R$ {client.totalCashback.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Compra</label>
                                        <p className="text-gray-900 font-medium mt-1">
                                            {client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString('pt-BR') : 'Nunca'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Histórico de Compras */}
                        {activeTab === 'history' && (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <div className="overflow-x-auto max-h-[500px]">
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50">
                                            <p className="text-gray-500">Nenhuma compra registrada</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium uppercase text-xs tracking-wider">Data</th>
                                                    <th className="px-6 py-3 font-medium uppercase text-xs tracking-wider">Produto(s)</th>
                                                    <th className="px-6 py-3 text-right font-medium uppercase text-xs tracking-wider">Valor</th>
                                                    <th className="px-6 py-3 text-right font-medium uppercase text-xs tracking-wider">Cashback</th>
                                                    <th className="px-6 py-3 text-center font-medium uppercase text-xs tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {transactions.map((t) => (
                                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                                            {new Date(t.purchaseDate).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {t.products_details && t.products_details.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {t.products_details.map((p, idx) => (
                                                                        <div key={idx} className="text-gray-700">
                                                                            <span className="font-medium">{p.productName}</span>
                                                                            {p.quantity && <span className="text-gray-500 text-xs ml-1">({p.quantity}x)</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-700">{t.product}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                            R$ {t.purchaseValue.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                                            R$ {t.cashbackValue.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                t.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                                                                t.status === 'Resgatado' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {t.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab: Analytics */}
                        {activeTab === 'analytics' && analytics && (
                            <div className="space-y-8">
                                {/* Métricas principais */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Gasto</div>
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <Icons.DollarSign size={20} />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            R$ {analytics.totalSpent.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Lifetime Value</div>
                                    </Card>

                                    <Card className="p-6 bg-gradient-to-br from-green-50 to-white border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Compras</div>
                                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                <Icons.ShoppingBag size={20} />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {analytics.purchaseCount}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Total de pedidos</div>
                                    </Card>

                                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Ticket Médio</div>
                                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                <Icons.BarChart2 size={20} />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            R$ {analytics.averageTicket.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Por compra</div>
                                    </Card>

                                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Produtos Únicos</div>
                                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                                <Icons.Tag size={20} />
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {analytics.uniqueProducts}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Variedade comprada</div>
                                    </Card>
                                </div>

                                {/* Seção Inferior: Grid de 3 colunas */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Cashback */}
                                    <Card className="p-6 border border-gray-100 shadow-sm h-full">
                                        <h4 className="font-bold text-gray-900 mb-6 flex items-center">
                                            <Icons.Gift className="mr-2 text-brand-primary" size={20} />
                                            Performance de Cashback
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end pb-4 border-b border-gray-50">
                                                <span className="text-gray-600 text-sm">Gerado</span>
                                                <span className="font-bold text-xl text-green-600">R$ {analytics.cashbackGenerated.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-end pb-4 border-b border-gray-50">
                                                <span className="text-gray-600 text-sm">Resgatado</span>
                                                <span className="font-bold text-xl text-blue-600">R$ {analytics.cashbackRedeemed.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-gray-600 text-sm">Taxa de Resgate</span>
                                                <span className="font-bold text-xl text-purple-600">{analytics.redemptionRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Top Produtos */}
                                    <Card className="p-6 border border-gray-100 shadow-sm h-full">
                                        <h4 className="font-bold text-gray-900 mb-6 flex items-center">
                                            <Icons.TrendingUp className="mr-2 text-brand-primary" size={20} />
                                            Top 5 Produtos
                                        </h4>
                                        {analytics.topProducts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                                <Icons.ShoppingBag size={32} className="mb-2 opacity-50" />
                                                <p className="text-sm">Nenhum produto registrado</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {analytics.topProducts.map((product, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center space-x-3 overflow-hidden">
                                                            <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="font-medium text-sm text-gray-800 truncate">{product.name}</span>
                                                        </div>
                                                        <div className="text-right flex-shrink-0 ml-4">
                                                            <div className="text-xs text-gray-500">{product.count} un</div>
                                                            <div className="font-bold text-sm text-green-600">
                                                                R$ {product.total.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>

                                    {/* Timeline */}
                                    <Card className="p-6 border border-gray-100 shadow-sm h-full">
                                        <h4 className="font-bold text-gray-900 mb-6 flex items-center">
                                            <Icons.Clock className="mr-2 text-brand-primary" size={20} />
                                            Linha do Tempo
                                        </h4>
                                        <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Primeira Compra</p>
                                                <p className="font-medium text-gray-900">
                                                    {analytics.firstPurchaseDate
                                                        ? new Date(analytics.firstPurchaseDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Última Compra</p>
                                                <p className="font-medium text-gray-900">
                                                    {analytics.lastPurchaseDate
                                                        ? new Date(analytics.lastPurchaseDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="relative">
                                                <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 ${
                                                    !analytics.daysSinceLastPurchase ? 'bg-gray-100 border-gray-400' :
                                                    analytics.daysSinceLastPurchase > 60 ? 'bg-red-100 border-red-500' :
                                                    analytics.daysSinceLastPurchase > 30 ? 'bg-yellow-100 border-yellow-500' :
                                                    'bg-green-100 border-green-500'
                                                }`}></div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status Recente</p>
                                                <p className={`font-bold text-lg ${
                                                    analytics.daysSinceLastPurchase === null ? 'text-gray-400' :
                                                    analytics.daysSinceLastPurchase > 60 ? 'text-red-600' :
                                                    analytics.daysSinceLastPurchase > 30 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                    {analytics.daysSinceLastPurchase !== null
                                                        ? `${analytics.daysSinceLastPurchase} dias sem comprar`
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};
