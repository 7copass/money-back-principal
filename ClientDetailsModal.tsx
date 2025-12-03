import React, { useState, useEffect } from 'react';
import { Client, ClientAnalytics, TransactionDetailed } from './types';
import { api } from './services';
import { Button, Card, Icons, Modal } from './components';

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
        <Modal isOpen={isOpen} onClose={onClose} title={`Cliente: ${client.name}`} size="2xl">
            <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'info'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📋 Informações
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            🛒 Histórico de Compras
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📊 Analytics
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : (
                    <>
                        {/* Tab: Informações */}
                        {activeTab === 'info' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Nome</label>
                                    <p className="text-gray-900">{client.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">CPF</label>
                                    <p className="text-gray-900">{client.cpf}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Telefone</label>
                                    <p className="text-gray-900">{client.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-gray-900">{client.email || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Tier</label>
                                    <p className="text-gray-900">{client.status}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Pontos</label>
                                    <p className="text-gray-900">{client.points}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Cashback Disponível</label>
                                    <p className="text-gray-900 font-bold text-green-600">
                                        R$ {client.totalCashback.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Última Compra</label>
                                    <p className="text-gray-900">
                                        {client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString('pt-BR') : 'Nunca'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tab: Histórico de Compras */}
                        {activeTab === 'history' && (
                            <div className="overflow-x-auto max-h-96">
                                {transactions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Nenhuma compra registrada</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto(s)</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cashback</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {transactions.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {new Date(t.purchaseDate).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {t.products_details && t.products_details.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {t.products_details.map((p, idx) => (
                                                                    <div key={idx} className="text-xs">
                                                                        {p.productName} {p.quantity ? `(${p.quantity}x)` : ''}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span>{t.product}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        R$ {t.purchaseValue.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-green-600 font-medium">
                                                        R$ {t.cashbackValue.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.status === 'Disponível' ? 'bg-green-100 text-green-800' :
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
                        )}

                        {/* Tab: Analytics */}
                        {activeTab === 'analytics' && analytics && (
                            <div className="space-y-6">
                                {/* Métricas principais */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="p-4 bg-blue-50">
                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Gasto</div>
                                        <div className="text-xl lg:text-2xl font-bold text-blue-700 break-words">
                                            R$ {analytics.totalSpent.toFixed(2)}
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-green-50">
                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Compras</div>
                                        <div className="text-xl lg:text-2xl font-bold text-green-700 break-words">
                                            {analytics.purchaseCount}
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-purple-50">
                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Ticket Médio</div>
                                        <div className="text-xl lg:text-2xl font-bold text-purple-700 break-words">
                                            R$ {analytics.averageTicket.toFixed(2)}
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-yellow-50">
                                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Produtos Únicos</div>
                                        <div className="text-xl lg:text-2xl font-bold text-yellow-700 break-words">
                                            {analytics.uniqueProducts}
                                        </div>
                                    </Card>
                                </div>

                                {/* Cashback */}
                                <Card className="p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">Cashback</h4>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-600">Gerado</div>
                                            <div className="font-bold text-green-600">R$ {analytics.cashbackGenerated.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Resgatado</div>
                                            <div className="font-bold text-blue-600">R$ {analytics.cashbackRedeemed.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Taxa de Resgate</div>
                                            <div className="font-bold text-purple-600">{analytics.redemptionRate.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Top Produtos */}
                                <Card className="p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">Top 5 Produtos</h4>
                                    {analytics.topProducts.length === 0 ? (
                                        <p className="text-sm text-gray-500">Nenhum produto registrado</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {analytics.topProducts.map((product, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium">{product.name}</span>
                                                    <div className="text-right">
                                                        <span className="text-gray-600">{product.count}x</span>
                                                        <span className="ml-2 font-bold text-green-600">
                                                            R$ {product.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>

                                {/* Datas */}
                                <Card className="p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3">Timeline</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Primeira Compra:</span>
                                            <span className="font-medium">
                                                {analytics.firstPurchaseDate
                                                    ? new Date(analytics.firstPurchaseDate).toLocaleDateString('pt-BR')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Última Compra:</span>
                                            <span className="font-medium">
                                                {analytics.lastPurchaseDate
                                                    ? new Date(analytics.lastPurchaseDate).toLocaleDateString('pt-BR')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Dias desde última compra:</span>
                                            <span className={`font-bold ${analytics.daysSinceLastPurchase === null ? 'text-gray-400' :
                                                analytics.daysSinceLastPurchase > 60 ? 'text-red-600' :
                                                    analytics.daysSinceLastPurchase > 30 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                }`}>
                                                {analytics.daysSinceLastPurchase !== null
                                                    ? `${analytics.daysSinceLastPurchase} dias`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};
