
import React, { useState, createContext, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import type { User } from './types';
import { UserRole } from './types';
import { LoginPage, Dashboard } from './pages';
import { Sidebar, Header, Icons, Loader } from './components';
import { supabase } from './supabaseClient';
import { api } from './services';
import { storage } from './utils/storage';
import { registerDevHotkeys, logDevInfo, checkStaleData, forceReload } from './utils/dev-helpers';

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
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let cleanupHotkeys: (() => void) | null = null;

        // PROTEÇÃO: Timeout máximo de 10 segundos
        const forceLoadingEnd = () => {
            console.warn("⚠️ TIMEOUT: Forçando saída do loading após 10s");
            setLoading(false);
        };

        timeoutId = setTimeout(forceLoadingEnd, 10000);

        // Limpa dados expirados ao iniciar
        console.log("🧹 Limpando dados expirados do storage...");
        storage.cleanExpiredData();

        // Verifica dados obsoletos
        const staleCheck = checkStaleData();
        if (staleCheck.hasStaleData) {
            console.warn(`⚠️ Dados com ${staleCheck.oldestAge?.toFixed(1)}h detectados`);
        }

        // Registra hotkeys de desenvolvimento
        cleanupHotkeys = registerDevHotkeys();
        
        // Log de info de desenvolvimento
        logDevInfo();

        // Initial load
        const initSession = async () => {
            try {
                console.log("🔄 [AUTH] Iniciando verificação de sessão...");
                setLoading(true); // Garante que está em loading
                
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("❌ [AUTH] Erro ao buscar sessão:", sessionError);
                    return;
                }

                if (session) {
                    console.log("✅ [AUTH] Sessão encontrada, buscando perfil...");
                    const profile = await api.getProfile(session.user.id);

                    if (profile) {
                        console.log("✅ [AUTH] Perfil carregado:", profile.name);
                        setUser(profile);
                    } else {
                        console.warn("⚠️ [AUTH] Perfil não encontrado, fazendo logout...");
                        await supabase.auth.signOut();
                        // Limpa dados do app quando não há usuário
                        storage.clearAllAppData();
                    }
                } else {
                    console.log("ℹ️ [AUTH] Nenhuma sessão ativa");
                    // Limpa dados do app quando não há sessão
                    storage.clearAllAppData();
                }
            } catch (error) {
                console.error("❌ [AUTH] Erro crítico ao inicializar sessão:", error);
            } finally {
                console.log("✅ [AUTH] Finalizando loading no finally");
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };

        initSession();

        // Listen for changes com DEBOUNCE para evitar múltiplas chamadas
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 [AUTH] Auth state change:", event);

            // Limpa timer anterior se existir
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Debounce de 300ms para evitar chamadas em rápida sucessão
            debounceTimerRef.current = setTimeout(async () => {
                try {
                    if (event === 'SIGNED_IN' && session) {
                        console.log("✅ [AUTH] SIGNED_IN - Buscando perfil...");
                        const profile = await api.getProfile(session.user.id);
                        if (profile) {
                            console.log("✅ [AUTH] Perfil atualizado:", profile.name);
                            setUser(profile);
                        }
                    } else if (event === 'SIGNED_OUT') {
                        console.log("👋 [AUTH] SIGNED_OUT - Limpando dados...");
                        setUser(null);
                        // Limpa dados do app ao deslogar
                        storage.clearAllAppData();
                    } else if (event === 'TOKEN_REFRESHED') {
                        console.log("🔄 [AUTH] TOKEN_REFRESHED - Token atualizado");
                        // Não precisa fazer nada, apenas log
                    }
                } catch (error) {
                    console.error("❌ [AUTH] Erro no listener:", error);
                } finally {
                    // SEMPRE finaliza loading no finally
                    console.log("✅ [AUTH] Finalizando loading no listener");
                    setLoading(false);
                }
            }, 300);
        });

        // Cleanup ao desmontar
        return () => {
            console.log("🧹 [AUTH] Cleanup do AuthProvider");
            clearTimeout(timeoutId);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            // Cleanup do listener
            authListener.subscription.unsubscribe();
            // Cleanup dos hotkeys
            if (cleanupHotkeys) {
                cleanupHotkeys();
            }
        };
    }, []);


    const logout = useCallback(async () => {
        console.log("👋 [AUTH] Executando logout...");
        await supabase.auth.signOut();
        // Limpa dados do app ao fazer logout manual
        storage.clearAllAppData();
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
    const [showDevPanel, setShowDevPanel] = useState(false);

    const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;

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

    // Verifica dados obsoletos ao montar (apenas em dev)
    useEffect(() => {
        if (IS_DEV && user) {
            const staleData = checkStaleData();
            if (staleData.hasStaleData && staleData.oldestAge && staleData.oldestAge > 12) {
                console.warn('⚠️ Dados obsoletos detectados. Considere limpar o cache usando Ctrl+Shift+R');
            }
        }
    }, [user, IS_DEV]);

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
            
            {/* Botão de Debug (apenas em DEV) */}
            {IS_DEV && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => setShowDevPanel(!showDevPanel)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 transition-all"
                        title="Debug Tools (Dev Only)"
                    >
                        🛠️ DEV
                    </button>
                    
                    {showDevPanel && (
                        <div className="absolute bottom-14 right-0 bg-white rounded-lg shadow-2xl p-4 w-64 border border-gray-200">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b">
                                <h3 className="font-bold text-gray-800 text-sm">🛠️ Debug Tools</h3>
                                <button onClick={() => setShowDevPanel(false)} className="text-gray-500 hover:text-gray-700">
                                    ✕
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Limpar todo cache e recarregar?')) {
                                            forceReload();
                                        }
                                    }}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs font-medium"
                                >
                                    🔄 Force Reload
                                </button>
                                
                                <button
                                    onClick={() => {
                                        storage.cleanExpiredData();
                                        alert('Dados expirados limpos!');
                                    }}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium"
                                >
                                    🧹 Limpar Expirados
                                </button>
                                
                                <button
                                    onClick={() => {
                                        const info = storage.getStorageInfo();
                                        alert(`Storage Info:\nTotal Keys: ${info.totalKeys}\nApp Keys: ${info.appKeys}\nOldest: ${info.oldestTimestamp ? new Date(info.oldestTimestamp).toLocaleString() : 'N/A'}`);
                                    }}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs font-medium"
                                >
                                    📊 Storage Info
                                </button>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                <p><strong>Hotkeys:</strong></p>
                                <p>Ctrl+Shift+R: Force Reload</p>
                                <p>Ctrl+Shift+I: Storage Info</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
