# ⚠️ ERRO: Variáveis de Ambiente Não Configuradas

## 🔴 Problema:
A aplicação não está encontrando a URL do Supabase!

## ✅ SOLUÇÃO:

### 1. Abra o arquivo `.env.local` e adicione:

```bash
# Supabase
VITE_SUPABASE_URL=https://phznyksqgtanfqcphvod.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY_AQUI

# SendGrid (para referência, não usado no frontend)
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FROM_EMAIL=contato@fidelify.com.br
```

### 2. Como pegar o VITE_SUPABASE_ANON_KEY:

1. Acesse: https://supabase.com/dashboard/project/phznyksqgtanfqcphvod/settings/api
2. Copie a chave "anon public"
3. Cole no `.env.local`

### 3. Reinicie a aplicação:

```bash
# Pare o servidor (Ctrl+C)
# Rode novamente:
npm run dev
```

### 4. Recarregue o navegador:
- Pressione **Ctrl+Shift+R**

---

## 📋 Exemplo completo do .env.local:

```bash
VITE_DEV_MODE=true

# Evolution API
VITE_EVOLUTION_API_URL=https://evo.tcsistemas.com
VITE_EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976

# Supabase
VITE_SUPABASE_URL=https://phznyksqgtanfqcphvod.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI

# SendGrid (referência)
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FROM_EMAIL=contato@fidelify.com.br
```

---

## ⚠️ IMPORTANTE:

As variáveis com prefixo `VITE_` são expostas no frontend.
A API Key do SendGrid está na Edge Function (seguro).

---

**Adicione a URL e a Anon Key, reinicie e teste novamente!** 🚀
