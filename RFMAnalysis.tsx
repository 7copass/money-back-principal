import React, { useState, useEffect, useMemo } from 'react';
import { api } from './services';
import { RFMData, RFMClient } from './types';
import { Card, Button, Icons, Loader, Modal } from './components';

export const RFMAnalysis: React.FC<{ companyId: string }> = ({ companyId }) => {
    const [data, setData] = useState<RFMData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<RFMClient | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        loadData();
    }, [companyId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await api.getRFMAnalysis(companyId);
            setData(result);
        } catch (error) {
            console.error('Error loading RFM analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = useMemo(() => {
        if (!data) return [];
        if (!selectedSegment) return data.clients;
        return data.clients.filter(c => c.segment === selectedSegment);
    }, [data, selectedSegment]);

    const segmentConfig: Record<string, { color: string; icon: string; description: string; action: string }> = {
        'Champions': { 
            color: 'bg-purple-100 text-purple-800 border-purple-200', 
            icon: '🏆', 
            description: 'Seus melhores clientes. Compram sempre e gastam muito.',
            action: 'Dar tratamento VIP e recompensas exclusivas.'
        },
        'Loyal Customers': { 
            color: 'bg-blue-100 text-blue-800 border-blue-200', 
            icon: '💎', 
            description: 'Compram com frequência e bom valor.',
            action: 'Oferecer programas de fidelidade e upsell.'
        },
        'Potential Loyalists': { 
            color: 'bg-teal-100 text-teal-800 border-teal-200', 
            icon: '🌟', 
            description: 'Recentes com bom potencial de virarem fiéis.',
            action: 'Recomendar produtos e oferecer incentivos para retorno.'
        },
        'New Customers': { 
            color: 'bg-green-100 text-green-800 border-green-200', 
            icon: '🆕', 
            description: 'Compraram recentemente pela primeira vez.',
            action: 'Onboarding e incentivo para a segunda compra.'
        },
        'Promising': { 
            color: 'bg-cyan-100 text-cyan-800 border-cyan-200', 
            icon: '🎯', 
            description: 'Compradores recentes mas com frequência baixa.',
            action: 'Criar relacionamento e brand awareness.'
        },
        'Need Attention': { 
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
            icon: '⚠️', 
            description: 'Bons clientes que não compram há algum tempo.',
            action: 'Ofertas limitadas para reativação imediata.'
        },
        'About to Sleep': { 
            color: 'bg-orange-100 text-orange-800 border-orange-200', 
            icon: '😴', 
            description: 'Clientes inativos e de baixo valor.',
            action: 'Tentar recuperar com descontos agressivos.'
        },
        'At Risk': { 
            color: 'bg-red-100 text-red-800 border-red-200', 
            icon: '🚨', 
            description: 'Clientes valiosos que pararam de comprar.',
            action: 'Contato pessoal e ofertas irrecusáveis.'
        },
        "Can't Lose Them": { 
            color: 'bg-pink-100 text-pink-800 border-pink-200', 
            icon: '🆘', 
            description: 'Campeões que sumiram. Prioridade máxima!',
            action: 'Falar diretamente e resolver qualquer problema.'
        },
        'Hibernating': { 
            color: 'bg-gray-100 text-gray-800 border-gray-200', 
            icon: '💤', 
            description: 'Inativos há muito tempo e baixo valor.',
            action: 'Campanhas de baixo custo ou deixar ir.'
        },
        'Lost': { 
            color: 'bg-gray-200 text-gray-600 border-gray-300', 
            icon: '💀', 
            description: 'Perdidos. Não valem o esforço de recuperação.',
            action: 'Ignorar ou tentar campanha final.'
        }
    };

    if (loading) return <Loader className="py-12 text-brand-primary" text="Calculando Matriz RFM..." />;
    if (!data) return <div className="p-8 text-center text-gray-500">Não foi possível carregar a análise.</div>;

    return (
        <div className="space-y-8">
            {/* Header com Guia */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <Icons.BarChart2 className="text-brand-primary" />
                            Segmentação Inteligente (RFM)
                        </h2>
                        <p className="text-gray-600">
                            Análise automática baseada em Recência, Frequência e Valor.
                        </p>
                    </div>
                    <Button 
                        onClick={() => setShowGuide(!showGuide)} 
                        className="!bg-white !text-brand-primary border border-brand-primary hover:!bg-brand-bg text-sm font-medium shadow-sm"
                    >
                        {showGuide ? 'Ocultar Guia' : 'Entenda a Matriz RFM 💡'}
                    </Button>
                </div>

                {/* Conteúdo do Guia */}
                {showGuide && (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    As 3 Métricas
                                </h3>
                                <ul className="text-sm text-blue-700 space-y-2">
                                    <li><strong>🕒 Recência (R):</strong> Há quanto tempo comprou? (Quanto menor o tempo, melhor)</li>
                                    <li><strong>🔄 Frequência (F):</strong> Quantas vezes comprou? (Quanto mais, melhor)</li>
                                    <li><strong>💰 Valor (M):</strong> Quanto gastou no total? (Quanto mais, melhor)</li>
                                </ul>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                    <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    Os Scores (1 a 5)
                                </h3>
                                <p className="text-sm text-purple-700 mb-2">O sistema dá uma nota automática para cada cliente:</p>
                                <ul className="text-sm text-purple-700 space-y-1">
                                    <li>⭐⭐⭐⭐⭐ (5): Excelente</li>
                                    <li>⭐⭐⭐ (3): Regular</li>
                                    <li>⭐ (1): Ruim ou Inativo</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                    Estratégia Vencedora
                                </h3>
                                <ul className="text-sm text-green-700 space-y-2">
                                    <li>🏆 <strong>Reter:</strong> Mime os <em>Champions</em> e <em>Loyal</em>. Eles são seu lucro garantido.</li>
                                    <li>🚨 <strong>Recuperar:</strong> Corra atrás dos <em>At Risk</em>. Eles gastavam bem e pararam.</li>
                                    <li>🌱 <strong>Nutrir:</strong> Incentive <em>New Customers</em> a fazerem a 2ª compra.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded text-center">
                            💡 Dica: Clique nos cards coloridos abaixo para ver apenas os clientes daquele grupo e agir.
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(segmentConfig).map(([key, config]) => {
                    const stats = data.segments[key] || { count: 0, revenue: 0, percentage: 0 };
                    const isSelected = selectedSegment === key;
                    
                    return (
                        <button 
                            key={key}
                            onClick={() => setSelectedSegment(isSelected ? null : key)}
                            className={`text-left transition-all duration-200 hover:scale-105 focus:outline-none ${isSelected ? 'ring-2 ring-brand-primary ring-offset-2' : ''}`}
                        >
                            <Card className={`h-full border-l-4 ${config.color.replace('bg-', 'border-l-').split(' ')[0]} ${isSelected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                                        <span>{config.icon}</span> {key}
                                    </h3>
                                    <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full border border-gray-100">
                                        {stats.percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-gray-700">{stats.count}</p>
                                    <p className="text-xs text-gray-500">clientes</p>
                                    <p className="text-sm font-medium text-gray-600 mt-2">
                                        R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </Card>
                        </button>
                    );
                })}
            </div>

            {/* Tabela de Clientes */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {selectedSegment ? (
                                <>
                                    <span>{segmentConfig[selectedSegment]?.icon}</span>
                                    {selectedSegment}
                                    <span className="text-sm font-normal text-gray-500">({filteredClients.length} clientes)</span>
                                </>
                            ) : (
                                <>Todos os Clientes <span className="text-sm font-normal text-gray-500">({data.totalClients})</span></>
                            )}
                        </h3>
                        {selectedSegment && (
                            <p className="text-sm text-gray-500 mt-1">{segmentConfig[selectedSegment]?.action}</p>
                        )}
                    </div>
                    {selectedSegment && (
                        <Button onClick={() => setSelectedSegment(null)} className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">
                            Limpar Filtro
                        </Button>
                    )}
                </div>
                
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3 text-center">Segmento</th>
                                <th className="px-4 py-3 text-center" title="Recency - Frequency - Monetary">Score RFM</th>
                                <th className="px-4 py-3 text-right">Última Compra</th>
                                <th className="px-4 py-3 text-right">Compras</th>
                                <th className="px-4 py-3 text-right">Total Gasto</th>
                                <th className="px-4 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Nenhum cliente encontrado neste segmento.
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{client.name}</div>
                                            <div className="text-xs text-gray-500">{client.phone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${segmentConfig[client.segment]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {segmentConfig[client.segment]?.icon} {client.segment}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-gray-600">
                                            <span className={client.rScore >= 4 ? 'text-green-600 font-bold' : client.rScore <= 2 ? 'text-red-500' : ''}>{client.rScore}</span>-
                                            <span className={client.fScore >= 4 ? 'text-green-600 font-bold' : client.fScore <= 2 ? 'text-red-500' : ''}>{client.fScore}</span>-
                                            <span className={client.mScore >= 4 ? 'text-green-600 font-bold' : client.mScore <= 2 ? 'text-red-500' : ''}>{client.mScore}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {client.recency} dias atrás
                                            <div className="text-xs text-gray-400">{new Date(client.lastPurchaseDate).toLocaleDateString('pt-BR')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{client.totalPurchases}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            R$ {client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => setSelectedClient(client)}
                                                className="text-brand-primary hover:text-brand-secondary text-xs font-semibold underline"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Detalhes do Cliente */}
            <Modal
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                title="Detalhes do Cliente"
                size="lg"
            >
                {selectedClient && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedClient.name}</h3>
                                <p className="text-sm text-gray-500">{selectedClient.email || 'Sem email'} • {selectedClient.phone}</p>
                            </div>
                            <div className={`text-right px-3 py-1 rounded-lg border ${segmentConfig[selectedClient.segment]?.color}`}>
                                <p className="text-xs font-bold uppercase tracking-wider">Segmento</p>
                                <p className="font-bold flex items-center gap-1 justify-end">
                                    {segmentConfig[selectedClient.segment]?.icon} {selectedClient.segment}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-blue-600 font-bold uppercase">Recência (R)</p>
                                <p className="text-2xl font-bold text-blue-800">{selectedClient.rScore}/5</p>
                                <p className="text-xs text-blue-600">{selectedClient.recency} dias sem comprar</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-green-600 font-bold uppercase">Frequência (F)</p>
                                <p className="text-2xl font-bold text-green-800">{selectedClient.fScore}/5</p>
                                <p className="text-xs text-green-600">{selectedClient.totalPurchases} compras totais</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-purple-600 font-bold uppercase">Monetário (M)</p>
                                <p className="text-2xl font-bold text-purple-800">{selectedClient.mScore}/5</p>
                                <p className="text-xs text-purple-600">R$ {selectedClient.totalSpent.toLocaleString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                            <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <Icons.Megaphone className="w-4 h-4" /> Ação Recomendada
                            </h4>
                            <p className="text-yellow-900 text-sm">
                                {segmentConfig[selectedClient.segment]?.action}
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button onClick={() => setSelectedClient(null)} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                Fechar
                            </Button>
                            <Button onClick={() => window.open(`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`, '_blank')}>
                                <Icons.MessageSquare className="w-4 h-4 mr-2 inline" />
                                Contatar via WhatsApp
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
