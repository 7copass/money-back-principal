
import React, { useState, createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import type { User } from './types';
import { UserRole } from './types';
import { LoginPage, Dashboard } from './pages';
import { Sidebar, Header, Icons, Loader } from './components';
import { supabase } from './supabaseClient';
import { api } from './services';

interface AuthContextType {
    user: User | null;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // PROTEÇÃO: Timeout máximo de 10 segundos
        const forceLoadingEnd = () => {
            console.warn("⚠️ TIMEOUT: Forçando saída do loading após 10s");
            setLoading(false);
        };

        timeoutId = setTimeout(forceLoadingEnd, 10000);

        // Initial load
        const initSession = async () => {
            try {
                console.log("🔄 Iniciando verificação de sessão...");
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("❌ Erro ao buscar sessão:", sessionError);
                    clearTimeout(timeoutId);
                    setLoading(false);
                    return;
                }

                if (session) {
                    console.log("✅ Sessão encontrada, buscando perfil...");
                    const profile = await api.getProfile(session.user.id);

                    if (profile) {
                        console.log("✅ Perfil carregado:", profile.name);
                        setUser(profile);
                    } else {
                        console.warn("⚠️ Perfil não encontrado, fazendo logout...");
                        await supabase.auth.signOut();
                    }
                } else {
                    console.log("ℹ️ Nenhuma sessão ativa");
                }
            } catch (error) {
                console.error("❌ Erro crítico ao inicializar sessão:", error);
            } finally {
                console.log("✅ Finalizando loading");
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };

        initSession();

        // Listen for changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 Auth state change:", event);

            if (event === 'SIGNED_IN' && session) {
                // Não bloqueia a UI com loading(true) para atualizações de sessão em background
                const profile = await api.getProfile(session.user.id);
                if (profile) {
                    console.log("✅ Perfil atualizado:", profile.name);
                    setUser(profile);
                }
                setLoading(false);
            } else if (event === 'SIGNED_OUT') {
                console.log("👋 Usuário deslogado");
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            authListener.subscription.unsubscribe();
        };
    }, []);


    const logout = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    const value = useMemo(() => ({ user, logout, loading }), [user, logout, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Notification Scheduler Component
const NotificationScheduler: React.FC<{ user: User | null }> = ({ user }) => {
    useEffect(() => {
        if (!user || user.role !== UserRole.ADM || !user.companyId) {
            return;
        }

        console.log('[Scheduler] Starting notification scheduler for company:', user.companyId);

        // Run immediately on mount
        const processNotifications = async () => {
            try {
                console.log('[Scheduler] Processing notifications...');
                const result = await api.notifications.processExpirationNotifications(user.companyId!);
                console.log('[Scheduler] Result:', result);
            } catch (error) {
                console.error('[Scheduler] Error processing notifications:', error);
            }
        };

        // Initial run
        processNotifications();

        // Run every hour
        const interval = setInterval(processNotifications, 60 * 60 * 1000); // 1 hour

        return () => {
            console.log('[Scheduler] Stopping notification scheduler');
            clearInterval(interval);
        };
    }, [user]);

    return null; // This component doesn't render anything
};

const AppContent: React.FC = () => {
    const { user, loading, logout } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [showRefresh, setShowRefresh] = useState(false);

    useEffect(() => {
        if (user) {
            setCurrentPage('dashboard');
        }
    }, [user]);

    // Timer para mostrar botão de refresh apenas se demorar muito
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => setShowRefresh(true), 3000); // Só mostra após 3s
            return () => clearTimeout(timer);
        } else {
            setShowRefresh(false);
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-darkest p-4 text-center">
                <Loader className="text-brand-primary" text="Carregando..." />

                {showRefresh && (
                    <div className="animate-fade-in">
                        <p className="text-gray-400 text-sm mb-3">Está demorando mais que o esperado?</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20 font-medium text-sm"
                        >
                            Recarregar Página
                        </button>
                    </div>
                )}
            </div>
        );
    }
    if (!user) {
        return <LoginPage />;
    }

    return (
        <>
            <NotificationScheduler user={user} />
            <DashboardLayout user={user} currentPage={currentPage} onNavigate={setCurrentPage} />
        </>
    );
};

const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    registrar: 'Registrar Cashback',
    resgatar: 'Resgatar Cashback',
    campanhas: 'Campanhas',
    empresas: 'Empresas',
    whatsapp: 'Conexão WhatsApp',
    usuarios: 'Usuários',
    clientes: 'Clientes',
    produtos: 'Produtos e Serviços',
    permissoes: 'Permissões',
    historico: 'Histórico',
    ranking: 'Ranking',
}

const DashboardLayout: React.FC<{ user: User; currentPage: string; onNavigate: (page: string) => void; }> = ({ user, currentPage, onNavigate }) => {
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const getTitle = () => {
        if (currentPage === 'dashboard') {
            switch (user.role) {
                case UserRole.MANAGER: return 'Dashboard do Gestor';
                case UserRole.ADM: return 'Dashboard';
                case UserRole.SELLER: return 'Dashboard do Vendedor';
                case UserRole.USER: return 'Minha Conta';
            }
        }
        return pageTitles[currentPage] || 'Moneyback';
    }

    return (
        <div className="min-h-screen bg-brand-bg">
            <Sidebar
                userRole={user.role}
                onNavigate={onNavigate}
                onLogout={logout}
                currentPage={currentPage}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <div className="md:ml-64 flex flex-col h-screen">
                <Header
                    title={getTitle()}
                    userName={user.name}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto">
                    <Dashboard user={user} onNavigate={onNavigate} currentPage={currentPage} />
                </main>
            </div>
        </div>
    );
};


function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
