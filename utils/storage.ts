/**
 * Gerenciador de LocalStorage com timestamp e limpeza automática
 * Previne problemas de cache em desenvolvimento
 */

interface StorageData<T> {
    value: T;
    timestamp: number;
}

const STORAGE_PREFIX = 'moneyback_';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

export const storage = {
    /**
     * Salva dados no localStorage com timestamp
     */
    set<T>(key: string, value: T): void {
        try {
            const data: StorageData<T> = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    },

    /**
     * Recupera dados do localStorage, validando timestamp
     */
    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            if (!item) return null;

            const data: StorageData<T> = JSON.parse(item);
            
            // Verifica se os dados não expiraram
            if (Date.now() - data.timestamp > MAX_AGE_MS) {
                this.remove(key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return null;
        }
    },

    /**
     * Remove um item específico
     */
    remove(key: string): void {
        localStorage.removeItem(STORAGE_PREFIX + key);
    },

    /**
     * Limpa dados expirados (>24h)
     */
    cleanExpiredData(): void {
        try {
            const now = Date.now();
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    try {
                        const item = localStorage.getItem(key);
                        if (!item) return;

                        const data: StorageData<any> = JSON.parse(item);
                        if (now - data.timestamp > MAX_AGE_MS) {
                            localStorage.removeItem(key);
                            console.log(`🧹 Limpou dado expirado: ${key}`);
                        }
                    } catch (e) {
                        // Se não conseguir parsear, remove
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao limpar dados expirados:', error);
        }
    },

    /**
     * Limpa TODOS os dados do app
     */
    clearAllAppData(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            
            // Também limpa dados do Supabase
            const supabaseKeys = keys.filter(k => k.includes('supabase'));
            supabaseKeys.forEach(k => localStorage.removeItem(k));
            
            console.log('🗑️ Todos os dados do app foram limpos');
        } catch (error) {
            console.error('Erro ao limpar todos os dados:', error);
        }
    },

    /**
     * Retorna informações sobre o storage
     */
    getStorageInfo(): { totalKeys: number; appKeys: number; oldestTimestamp: number | null } {
        const keys = Object.keys(localStorage);
        const appKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
        
        let oldestTimestamp: number | null = null;
        appKeys.forEach(key => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return;
                const data: StorageData<any> = JSON.parse(item);
                if (!oldestTimestamp || data.timestamp < oldestTimestamp) {
                    oldestTimestamp = data.timestamp;
                }
            } catch (e) {
                // Ignora erros de parse
            }
        });

        return {
            totalKeys: keys.length,
            appKeys: appKeys.length,
            oldestTimestamp
        };
    }
};
