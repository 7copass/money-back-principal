import React, { useState, useEffect } from 'react';
import { api } from './services';
import { Card } from './components';

interface NotificationHistoryTabProps {
    companyId: string;
}

export const NotificationHistoryTab: React.FC<NotificationHistoryTabProps> = ({ companyId }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [companyId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await api.notifications.getNotificationHistory(companyId);
            setHistory(data);
        } catch (error) {
            console.error('Error loading notification history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNotificationTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'expiration_7d': '7 dias antes',
            'expiration_5d': '5 dias antes',
            'expiration_3d': '3 dias antes',
            'expiration_2d': '2 dias antes',
            'expiration_today': 'No dia do vencimento'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <Card className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando histórico...</p>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-gray-500">📭 Nenhuma notificação enviada ainda</p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📋 Histórico de Envios</h3>
                <span className="text-sm text-gray-500">{history.length} registros</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {history.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    {new Date(log.sent_at).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-gray-900">{log.clients?.name}</div>
                                    <div className="text-xs text-gray-500">{log.clients?.phone}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {getNotificationTypeLabel(log.notification_type)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                    R$ {log.transactions?.cashback_value?.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {log.status === 'sent' ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Enviado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" title={log.error_message}>
                                            ✗ Falhou
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
