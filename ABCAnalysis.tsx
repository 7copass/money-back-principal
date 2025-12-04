import React, { useState, useEffect, useMemo } from 'react';
import { api } from './services';
import { Card, Button, Icons, Select, Loader } from './components';

interface ABCProduct {
    name: string;
    count: number;
    revenue: number;
    percentage: number;
    accumulated: number;
    class: 'A' | 'B' | 'C' | 'Sem Vendas';
}

interface ABCData {
    products: ABCProduct[];
    totalRevenue: number;
    period: { start: Date; end: Date };
}

export const ABCAnalysis: React.FC<{ companyId: string }> = ({ companyId }) => {
    const [data, setData] = useState<ABCData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30'); // dias
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        loadData();
    }, [companyId, period, customStart, customEnd]);

    const loadData = async () => {
        setLoading(true);
        try {
            let startDate: Date;
            let endDate = new Date();

            if (period === 'custom') {
                if (!customStart || !customEnd) {
                    setLoading(false);
                    return;
                }
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
            } else {
                startDate = new Date();
                startDate.setDate(endDate.getDate() - parseInt(period));
            }

            const result = await api.getABCAnalysis(companyId, startDate.toISOString(), endDate.toISOString());
            setData(result);
        } catch (error) {
            console.error('Error loading ABC analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const summary = useMemo(() => {
        if (!data) return null;

        const getStats = (cls: 'A' | 'B' | 'C' | 'Sem Vendas') => {
            const products = data.products.filter(p => p.class === cls);
            const revenue = products.reduce((sum, p) => sum + p.revenue, 0);
            const percentage = data.totalRevenue > 0 ? (revenue / data.totalRevenue) * 100 : 0;
            return { count: products.length, revenue, percentage };
        };

        return {
            A: getStats('A'),
            B: getStats('B'),
            C: getStats('C'),
            Z: getStats('Sem Vendas')
        };
    }, [data]);

    if (loading && !data) return <Loader className="py-12 text-brand-primary" text="Calculando Curva ABC..." />;

    return (
        <div className="space-y-6">
            {/* Header e Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Icons.BarChart2 className="text-brand-primary" />
                        Análise de Curva ABC
                    </h2>
                    <p className="text-sm text-gray-500">Identifique seus produtos mais valiosos (Pareto 80/20)</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
                        <option value="30">Últimos 30 dias</option>
                        <option value="60">Últimos 60 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="180">Últimos 6 meses</option>
                        <option value="365">Último ano</option>
                        <option value="custom">Personalizado</option>
                    </Select>
                    
                    {period === 'custom' && (
                        <div className="flex gap-2 items-center">
                            <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            />
                            <Button onClick={loadData} size="sm">Aplicar</Button>
                        </div>
                    )}
                </div>
            </div>

            {data && summary && (
                <>
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Classe A */}
                        <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-green-800 text-lg">Classe A</h3>
                                    <span className="text-xs font-medium bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Estrelas ⭐</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-700">{summary.A.percentage.toFixed(1)}%</p>
                                    <p className="text-xs text-green-600">do faturamento</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Produtos:</span>
                                    <span className="font-bold text-gray-900">{summary.A.count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Receita:</span>
                                    <span className="font-bold text-gray-900">R$ {summary.A.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-green-100 text-xs text-green-700 italic">
                                "Alta importância. Nunca deixe faltar estoque!"
                            </div>
                        </Card>

                        {/* Classe B */}
                        <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-yellow-800 text-lg">Classe B</h3>
                                    <span className="text-xs font-medium bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Oportunidades 📈</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-yellow-700">{summary.B.percentage.toFixed(1)}%</p>
                                    <p className="text-xs text-yellow-600">do faturamento</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Produtos:</span>
                                    <span className="font-bold text-gray-900">{summary.B.count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Receita:</span>
                                    <span className="font-bold text-gray-900">R$ {summary.B.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-yellow-100 text-xs text-yellow-700 italic">
                                "Importância média. Potencial para virar A."
                            </div>
                        </Card>

                        {/* Classe C */}
                        <Card className="p-6 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-red-800 text-lg">Classe C</h3>
                                    <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Atenção ⚠️</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-red-700">{summary.C.percentage.toFixed(1)}%</p>
                                    <p className="text-xs text-red-600">do faturamento</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Produtos:</span>
                                    <span className="font-bold text-gray-900">{summary.C.count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Receita:</span>
                                    <span className="font-bold text-gray-900">R$ {summary.C.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-red-100 text-xs text-red-700 italic">
                                "Baixo impacto. Avalie promoções ou descontinuação."
                            </div>
                        </Card>

                        {/* Sem Vendas */}
                        <Card className="p-6 border-l-4 border-l-gray-400 bg-gradient-to-br from-gray-50 to-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-700 text-lg">Sem Vendas</h3>
                                    <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Parados 🛑</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-600">{summary.Z.count}</p>
                                    <p className="text-xs text-gray-500">produtos</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Produtos:</span>
                                    <span className="font-bold text-gray-900">{summary.Z.count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Receita:</span>
                                    <span className="font-bold text-gray-900">R$ 0,00</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 italic">
                                "Sem movimento no período. Avalie o motivo."
                            </div>
                        </Card>
                    </div>

                    {/* Gráfico Visual Simplificado */}
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Distribuição de Faturamento (Top 20)</h3>
                        <div className="relative h-64 flex items-end gap-1 border-b border-gray-200 pb-1">
                            {data.products.filter(p => p.revenue > 0).slice(0, 20).map((p, i) => {
                                const maxRevenue = data.products[0].revenue;
                                const height = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
                                const colorClass = p.class === 'A' ? 'bg-green-500' : p.class === 'B' ? 'bg-yellow-500' : 'bg-red-400';
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                        <div 
                                            className={`w-full rounded-t ${colorClass} transition-all hover:opacity-80`}
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-lg">
                                            <p className="font-bold">{p.name}</p>
                                            <p>R$ {p.revenue.toFixed(2)}</p>
                                            <p>{p.percentage.toFixed(1)}% (Acum: {p.accumulated.toFixed(1)}%)</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Top 1</span>
                            <span>Top 20 Produtos</span>
                        </div>
                    </Card>

                    {/* Tabela Detalhada */}
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Detalhamento por Produto</h3>
                            <span className="text-xs text-gray-500">Ordenado por faturamento</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-16">Rank</th>
                                        <th className="px-4 py-3">Produto</th>
                                        <th className="px-4 py-3 text-center">Classe</th>
                                        <th className="px-4 py-3 text-right">Qtd.</th>
                                        <th className="px-4 py-3 text-right">Faturamento</th>
                                        <th className="px-4 py-3 text-right">% Total</th>
                                        <th className="px-4 py-3 text-right">% Acum.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.products.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center font-medium text-gray-500">#{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap ${
                                                    p.class === 'A' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    p.class === 'B' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    p.class === 'C' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    'bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}>
                                                    {p.class}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">{p.count}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">{p.percentage.toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-right text-gray-500 text-xs">{p.accumulated.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                    {data.products.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                                Nenhum produto encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
