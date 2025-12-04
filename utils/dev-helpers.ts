/**
 * Utilitários para desenvolvimento - apenas ativos em modo DEV
 */

import { storage } from './storage';

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;

/**
 * Força reload completo limpando todo cache e storage
 */
export const forceReload = (): void => {
    if (!IS_DEV) {
        console.warn('forceReload() só funciona em desenvolvimento');
        return;
    }

    console.log('🔄 Forçando reload completo...');
    
    // Limpa todo localStorage
    storage.clearAllAppData();
    
    // Limpa sessionStorage
    sessionStorage.clear();
    
    // Recarrega página sem cache
    window.location.reload();
};

/**
 * Verifica dados obsoletos no storage
 */
export const checkStaleData = (): { hasStaleData: boolean; oldestAge: number | null } => {
    const info = storage.getStorageInfo();
    
    if (!info.oldestTimestamp) {
        return { hasStaleData: false, oldestAge: null };
    }

    const ageInHours = (Date.now() - info.oldestTimestamp) / (1000 * 60 * 60);
    const hasStaleData = ageInHours > 12; // Considera obsoleto se > 12h

    if (hasStaleData && IS_DEV) {
        console.warn(`⚠️ Dados obsoletos detectados (${ageInHours.toFixed(1)}h). Considere limpar o cache.`);
    }

    return {
        hasStaleData,
        oldestAge: ageInHours
    };
};

/**
 * Registra hotkey para force reload (Ctrl+Shift+R)
 */
export const registerDevHotkeys = (): (() => void) => {
    if (!IS_DEV) {
        return () => {}; // Retorna função vazia se não estiver em dev
    }

    const handleKeyPress = (e: KeyboardEvent) => {
        // Ctrl+Shift+R or Cmd+Shift+R
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            console.log('🔥 Hotkey detectada: Ctrl+Shift+R');
            
            const confirm = window.confirm(
                '🔄 Forçar reload completo?\n\n' +
                'Isso irá:\n' +
                '- Limpar todo localStorage\n' +
                '- Limpar sessionStorage\n' +
                '- Recarregar a página\n\n' +
                'Continuar?'
            );

            if (confirm) {
                forceReload();
            }
        }

        // Ctrl+Shift+I para mostrar info do storage
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            const info = storage.getStorageInfo();
            const stale = checkStaleData();
            
            console.log('📊 Informações do Storage:', {
                totalKeys: info.totalKeys,
                appKeys: info.appKeys,
                oldestTimestamp: info.oldestTimestamp ? new Date(info.oldestTimestamp).toLocaleString() : 'N/A',
                oldestAge: stale.oldestAge ? `${stale.oldestAge.toFixed(1)}h` : 'N/A',
                hasStaleData: stale.hasStaleData
            });
        }
    };

    window.addEventListener('keydown', handleKeyPress);
    console.log('⌨️ Hotkeys de desenvolvimento ativadas:');
    console.log('   Ctrl+Shift+R: Force reload');
    console.log('   Ctrl+Shift+I: Storage info');

    // Retorna função de cleanup
    return () => {
        window.removeEventListener('keydown', handleKeyPress);
    };
};

/**
 * Mostra informações de debug no console
 */
export const logDevInfo = (): void => {
    if (!IS_DEV) return;

    console.log('%c🚀 Modo Desenvolvimento Ativo', 'color: #4ade80; font-size: 14px; font-weight: bold;');
    console.log('%cHotkeys disponíveis:', 'color: #60a5fa; font-weight: bold;');
    console.log('  Ctrl+Shift+R → Force reload (limpa cache)');
    console.log('  Ctrl+Shift+I → Mostrar info do storage');
    
    const staleCheck = checkStaleData();
    if (staleCheck.hasStaleData) {
        console.warn(`⚠️ Dados com ${staleCheck.oldestAge?.toFixed(1)}h detectados. Execute forceReload() se houver problemas.`);
    }
};
