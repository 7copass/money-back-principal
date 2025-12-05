import React from 'react';
import { Card, Button } from './ui';
import { Icons } from './icons';
import { Company, Transaction, Campaign, Client } from '../types';

export const StatCard: React.FC<{ title: string; value: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ title, value, icon: Icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </Card>
);

export const CompanyTable: React.FC<{ companies: Company[] }> = ({ companies }) => (
    <Card>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-3">Empresa</th>
                        <th className="p-3">Plano</th>
                        <th className="p-3">Responsável</th>
                        <th className="p-3">Cashback Gerado</th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map(c => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{c.name}</td>
                            <td className="p-3">{c.plan}</td>
                            <td className="p-3">{c.responsible}</td>
                            <td className="p-3">R$ {c.totalCashbackGenerated.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

export const SalesChart: React.FC<{ data: { month: string; value: number }[] }> = ({ data }) => (
    <Card>
        <h3 className="text-lg font-bold mb-4">Vendas Mensais</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center w-full">
                    <div className="w-full bg-blue-500 rounded-t-md" style={{ height: `${Math.min(d.value / 100, 100)}%` }}></div>
                    <span className="text-xs mt-2">{d.month}</span>
                </div>
            ))}
        </div>
    </Card>
);

export const ClientRanking: React.FC<{ clients: Client[] }> = ({ clients }) => (
    <Card>
        <h3 className="text-lg font-bold mb-4">Ranking de Clientes</h3>
        <ul className="space-y-2">
            {clients.slice(0, 5).map((c, i) => (
                <li key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{i + 1}. {c.name}</span>
                    <span className="font-bold">{c.points} pts</span>
                </li>
            ))}
        </ul>
    </Card>
);

export const TransactionHistory: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <Card>
        <h3 className="text-lg font-bold mb-4">Histórico de Transações</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-3">Data</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Cashback</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{new Date(t.purchaseDate).toLocaleDateString()}</td>
                            <td className="p-3">{t.customerName}</td>
                            <td className="p-3">{t.product}</td>
                            <td className="p-3">R$ {t.purchaseValue.toFixed(2)}</td>
                            <td className="p-3 text-green-600">R$ {t.cashbackValue.toFixed(2)}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'Disponível' ? 'bg-green-100 text-green-700' :
                                        t.status === 'Resgatado' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {t.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

export const CampaignCard: React.FC<{ campaign: Campaign; onEdit: (c: Campaign) => void; onDelete: (c: Campaign) => void }> = ({ campaign, onEdit, onDelete }) => (
    <Card className="border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold">{campaign.name}</h3>
                <p className="text-gray-600">{campaign.description}</p>
                <div className="mt-2 text-sm">
                    <p>Multiplicador: <strong>{campaign.multiplier}x</strong></p>
                    <p>Mínimo: <strong>R$ {campaign.minPurchaseValue.toFixed(2)}</strong></p>
                    <p>Período: {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="flex space-x-2">
                <button onClick={() => onEdit(campaign)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Icons.Edit className="w-5 h-5" /></button>
                <button onClick={() => onDelete(campaign)} className="text-red-600 hover:bg-red-50 p-2 rounded">&times;</button>
            </div>
        </div>
    </Card>
);

export const Podium: React.FC<{ title: string; subtitle: string; data: any[]; valueFormatter: (v: any) => string }> = ({ title, subtitle, data, valueFormatter }) => (
    <Card className="text-center">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-gray-500 mb-6">{subtitle}</p>
        <div className="flex justify-center items-end space-x-4 h-48">
            {data.slice(0, 3).map((item, index) => {
                const height = index === 0 ? 'h-full' : index === 1 ? 'h-3/4' : 'h-1/2';
                const color = index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400';
                return (
                    <div key={item.id} className={`flex flex-col items-center justify-end w-1/3 ${height}`}>
                        <div className="mb-2 font-bold">{item.name}</div>
                        <div className={`w-full rounded-t-lg flex items-end justify-center pb-2 text-white font-bold ${color}`} style={{ height: '100%' }}>
                            {index + 1}º
                        </div>
                        <div className="mt-2 font-bold text-brand-primary">{valueFormatter(item.value)}</div>
                    </div>
                );
            })}
        </div>
    </Card>
);

export const Sidebar: React.FC<{ userRole: string; onNavigate: (page: string) => void; onLogout: () => void; currentPage: string; isOpen: boolean; setIsOpen: (v: boolean) => void }> = ({ userRole, onNavigate, onLogout, currentPage, isOpen, setIsOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.Logo },
        { id: 'empresas', label: 'Empresas', icon: Icons.Building, roles: ['MANAGER'] },
        { id: 'usuarios', label: 'Usuários', icon: Icons.Users, roles: ['MANAGER', 'ADM'] },
        { id: 'clientes', label: 'Clientes', icon: Icons.Users, roles: ['ADM', 'SELLER'] },
        { id: 'campanhas', label: 'Campanhas', icon: Icons.Gift, roles: ['ADM'] },
        { id: 'registrar', label: 'Registrar', icon: Icons.PlusCircle, roles: ['SELLER'] },
        { id: 'resgatar', label: 'Resgatar', icon: Icons.Cash, roles: ['SELLER'] },
        { id: 'historico', label: 'Histórico', icon: Icons.History, roles: ['USER'] },
        { id: 'ranking', label: 'Ranking', icon: Icons.Trophy, roles: ['ADM', 'SELLER'] },
    ];

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 flex items-center justify-center border-b">
                    <Icons.Logo className="text-blue-600" />
                    <span className="ml-2 text-xl font-bold">Fideli<span className="text-brand-darkest">fy</span></span>
                </div>
                <nav className="p-4 space-y-2">
                    {menuItems.filter(item => !item.roles || item.roles.includes(userRole)).map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                            className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentPage === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.label}
                        </button>
                    ))}
                    <button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 mt-8">
                        <Icons.Logout className="w-5 h-5 mr-3" />
                        Sair
                    </button>
                </nav>
            </aside>
        </>
    );
};

export const Header: React.FC<{ title: string; userName: string; onMenuClick: () => void }> = ({ title, userName, onMenuClick }) => (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
        <button onClick={onMenuClick} className="text-gray-600">
            <Icons.Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
        <div className="w-6" /> {/* Spacer */}
    </header>
);
