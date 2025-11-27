
import React, { useState, createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import type { User } from './types';
import { UserRole } from './types';
import { LoginPage, Dashboard } from './pages';
import { Sidebar, Header, Icons } from './components';
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
    // Initial load
    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
             const profile = await api.getProfile(session.user.id);
             if (profile) {
                 setUser(profile);
             } else {
                 await supabase.auth.signOut();
             }
        }
        setLoading(false);
    };

    initSession();

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            setLoading(true);
            const profile = await api.getProfile(session.user.id);
            if (profile) setUser(profile);
            setLoading(false);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);


  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({ user, logout, loading }), [user, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  useEffect(() => {
    if (user) {
        setCurrentPage('dashboard');
    }
  }, [user]);
  
  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-darkest p-4 text-center relative overflow-hidden">
            {/* Fundo decorativo sutil */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <Icons.Logo />
            </div>

            <div className="z-10 flex flex-col items-center">
                <div className="mb-6 animate-bounce text-brand-primary">
                     <Icons.Logo width="64" height="64" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Moneyback</h2>
                <p className="text-gray-400 text-lg font-medium animate-pulse mb-6">
                    Carregando sistema...
                </p>
            </div>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <DashboardLayout user={user} currentPage={currentPage} onNavigate={setCurrentPage} />;
};

const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    registrar: 'Registrar Cashback',
    resgatar: 'Resgatar Cashback',
    campanhas: 'Campanhas',
    empresas: 'Empresas',
    usuarios: 'Usuários',
    clientes: 'Clientes',
    permissoes: 'Permissões',
    historico: 'Histórico',
    ranking: 'Ranking',
}

const DashboardLayout: React.FC<{ user: User; currentPage: string; onNavigate: (page: string) => void; }> = ({ user, currentPage, onNavigate }) => {
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const getTitle = () => {
        if (currentPage === 'dashboard') {
            switch(user.role) {
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
