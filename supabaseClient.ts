
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phznyksqgtanfqcphvod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoem55a3NxZ3RhbmZxY3Bodm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjExNjIsImV4cCI6MjA3ODk5NzE2Mn0.yz1Chd7krFKH0_vNFYeg_fvTKPhEPPVGXXYboEIoQ2s';

// Configuração otimizada para evitar problemas de cache e sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Persiste a sessão no localStorage
        persistSession: true,
        // Auto-refresh do token antes de expirar
        autoRefreshToken: true,
        // Detecta sessão na URL (para magic links, etc)
        detectSessionInUrl: true,
        // Storage key customizado para evitar conflitos
        storageKey: 'fidelify-auth-token',
    }
});
