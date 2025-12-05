import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin customizado para limpar localStorage na primeira carga em desenvolvimento
function localStorageCleanupPlugin(): Plugin {
  return {
    name: 'localStorage-cleanup-dev',
    transformIndexHtml(html) {
      // Apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return html.replace(
          '<head>',
          `<head>
          <script>
            // Limpa cache obsoleto ao carregar em desenvolvimento
            (function() {
              const lastCleanKey = 'fidelify_last_dev_clean';
              const lastClean = localStorage.getItem(lastCleanKey);
              const now = Date.now();
              const oneHour = 60 * 60 * 1000;
              
              // Limpa a cada hora em dev
              if (!lastClean || (now - parseInt(lastClean)) > oneHour) {
                console.log('🧹 Limpando dados expirados do localStorage...');
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith('fidelify_')) {
                    try {
                      const item = localStorage.getItem(key);
                      if (item) {
                        const data = JSON.parse(item);
                        // Remove se tiver mais de 24h
                        if (data.timestamp && (now - data.timestamp) > (24 * 60 * 60 * 1000)) {
                          localStorage.removeItem(key);
                        }
                      }
                    } catch (e) {
                      // Se não conseguir parsear, mantém
                    }
                  }
                });
                localStorage.setItem(lastCleanKey, now.toString());
              }
            })();
          </script>`
        );
      }
      return html;
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Proxy para Evolution API (contornar CORS em desenvolvimento)
        proxy: {
          '/evolution-api': {
            target: env.VITE_EVOLUTION_API_URL || 'https://api.leaderaperformance.com.br',
            changeOrigin: true,
            secure: false, // Desabilita verificação SSL em desenvolvimento
            rewrite: (path) => path.replace(/^\/evolution-api/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
        },
        // Headers para prevenir cache em desenvolvimento
        headers: isDev ? {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } : {}
      },
      
      plugins: [
        react(),
        localStorageCleanupPlugin()
      ],
      
      // Não limpar console para ver logs importantes
      clearScreen: false,
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      
      build: {
        rollupOptions: {
          output: {
            // Separar vendor chunks para melhor cache em produção
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-recharts': ['recharts']
            }
          }
        },
        // Source maps em dev para debug
        sourcemap: isDev
      }
    };
});
