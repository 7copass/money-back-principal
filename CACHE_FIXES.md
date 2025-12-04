# 🛠️ Melhorias de Cache e Desenvolvimento

Este documento descreve as melhorias implementadas para resolver problemas de cache em desenvolvimento e otimizar a experiência de desenvolvimento.

## 📋 Resumo das Alterações

### 1. **Sistema de Storage com Timestamp** (`utils/storage.ts`)
- ✅ Adiciona timestamp automático em todos os dados salvos no localStorage
- ✅ Função `cleanExpiredData()` que remove dados com mais de 24h
- ✅ Função `clearAllAppData()` para limpar todos os dados do app
- ✅ Função `getStorageInfo()` para obter estatísticas do storage

**Uso:**
```typescript
import { storage } from './utils/storage';

// Salvar com timestamp
storage.set('minha-chave', { dados: 'valor' });

// Recuperar (retorna null se expirado)
const dados = storage.get('minha-chave');

// Limpar expirados
storage.cleanExpiredData();

// Limpar tudo
storage.clearAllAppData();
```

### 2. **Ferramentas de Desenvolvimento** (`utils/dev-helpers.ts`)
- ✅ Função `forceReload()` - limpa tudo e recarrega
- ✅ Função `checkStaleData()` - verifica dados obsoletos
- ✅ **Hotkeys registradas automaticamente em DEV:**
  - `Ctrl+Shift+R` → Force reload (limpa cache)
  - `Ctrl+Shift+I` → Mostra info do storage no console
- ✅ Logs informativos no console ao iniciar em modo DEV

### 3. **Vite Config Otimizado** (`vite.config.ts`)
- ✅ Headers de Cache-Control para prevenir cache em desenvolvimento
- ✅ Plugin customizado que limpa localStorage expirado automaticamente
- ✅ Split de chunks vendor para melhor cache em produção
- ✅ Source maps ativados em desenvolvimento
- ✅ `clearScreen: false` para não limpar console

### 4. **Supabase Client Configurado** (`supabaseClient.ts`)
- ✅ `persistSession: true` - persiste sessão no localStorage
- ✅ `autoRefreshToken: true` - renova token automaticamente
- ✅ `detectSessionInUrl: true` - detecta sessão em URLs (magic links)
- ✅ `storageKey` customizado para evitar conflitos

### 5. **Meta Tags de Cache** (`index.html`)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 6. **AuthProvider Melhorado** (`App.tsx`)
- ✅ **Debounce no authStateChange** (300ms) para evitar múltiplas chamadas
- ✅ **Cleanup completo** do listener ao desmontar
- ✅ **Limpeza automática** do storage quando user é null
- ✅ **Logs detalhados** em todos os pontos de mudança
- ✅ **setLoading(false)** sempre executado no `finally`
- ✅ **Integração com dev-helpers** (hotkeys, stale data check)

### 7. **Painel de Debug Visual** (apenas em DEV)
Um botão flutuante **🛠️ DEV** aparece no canto inferior direito com:
- 🔄 **Force Reload** - limpa tudo e recarrega
- 🧹 **Limpar Expirados** - remove apenas dados > 24h
- 📊 **Storage Info** - mostra estatísticas
- ⌨️ **Lista de Hotkeys** disponíveis

### 8. **Variável de Ambiente** (`.env.local`)
```bash
VITE_DEV_MODE=true
```
- Define modo de desenvolvimento
- Ativa ferramentas extras de debug
- **EM PRODUÇÃO**: remover ou setar como `false`

## 🚀 Como Usar

### Desenvolvimento Normal
1. As ferramentas são ativadas automaticamente se `VITE_DEV_MODE=true`
2. Hotkeys ficam disponíveis automaticamente
3. Storage é limpo automaticamente a cada hora em dev
4. Botão de debug aparece no canto inferior direito

### Se Tiver Problemas de Cache
1. **Método 1 - Hotkey**: Pressione `Ctrl+Shift+R`
2. **Método 2 - Botão**: Clique no botão **🛠️ DEV** → **Force Reload**
3. **Método 3 - Console**: Execute `forceReload()` no console do navegador
4. **Método 4 - Manual**: Limpe o cache do navegador normalmente

### Ver Informações do Storage
1. **Hotkey**: `Ctrl+Shift+I`
2. **Botão**: **🛠️ DEV** → **Storage Info**
3. **Console**: Execute `storage.getStorageInfo()`

## 📊 Logs no Console

Em desenvolvimento, você verá logs detalhados como:
```
🚀 Modo Desenvolvimento Ativo
⌨️ Hotkeys de desenvolvimento ativadas:
   Ctrl+Shift+R: Force reload
   Ctrl+Shift+I: Storage info
🧹 Limpando dados expirados do localStorage...
🔄 [AUTH] Iniciando verificação de sessão...
✅ [AUTH] Sessão encontrada, buscando perfil...
✅ [AUTH] Perfil carregado: Nome do Usuário
✅ [AUTH] Finalizando loading no finally
```

## ⚠️ Importante

### Em Produção
1. Setea `<boltAction type="file" filePath=".env.local">VITE_DEV_MODE=false` (ou remova o arquivo)
2. As ferramentas de debug **NÃO** aparecerão
3. Os hotkeys **NÃO** funcionarão
4. Apenas a limpeza automática de dados expirados continuará ativa

### Cache em Produção
- As meta tags de cache são aplicadas sempre, mas são honradas apenas pelos navegadores
- Em produção, o Vite faz build otimizado com cache adequado
- Os chunks vendor são separados para melhor cache de longo prazo

## 🐛 Troubleshooting

### "Stuck" na tela de loading
1. Aguarde 10 segundos (timeout automático)
2. Clique em "Recarregar Página" se aparecer
3. Use `Ctrl+Shift+R` para force reload

### Dados desatualizados/incorretos
1. Use `Ctrl+Shift+R` para limpar tudo
2. Ou use o botão **🛠️ DEV** → **Force Reload**
3. Em último caso, limpe o cache do navegador manualmente

### Hotkeys não funcionam
1. Verifique se `VITE_DEV_MODE=true` no `.env.local`
2. Recarregue a página
3. Verifique o console para mensagens de hotkeys registradas

## 📝 Checklist de Implementação

- ✅ Storage com timestamp (`utils/storage.ts`)
- ✅ Dev helpers com hotkeys (`utils/dev-helpers.ts`)
- ✅ Vite config otimizado com plugin de limpeza
- ✅ Supabase client configurado
- ✅ Meta tags de cache no HTML
- ✅ `.env.local` criado
- ✅ `.env.example` criado
- ✅ AuthProvider com debounce e cleanup
- ✅ Painel de debug visual
- ✅ Logs detalhados em auth
- ✅ Limpeza automá de storage

## 🎯 Benefícios

1. **Zero problemas de cache** em desenvolvimento
2. **Debugging fácil** com painel visual e hotkeys
3. **Logs claros** para entender o fluxo de autenticação
4. **Limpeza automática** de dados obsoletos
5. **Melhor performance** com chunks separados
6. **Sessão estável** com auth otimizado

---

**Desenvolvido para resolver problemas de cache no Moneyback Platform** 🚀
