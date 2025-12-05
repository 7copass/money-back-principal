# 🚀 Como Fazer Deploy da Edge Function

## ✅ O que foi criado:

1. **Edge Function**: `supabase/functions/send-email/index.ts`
2. **EmailService atualizado**: `src/services/emailService.ts` (agora chama a Edge Function)

---

## 📋 Pré-requisitos:

1. Conta no Supabase
2. Supabase CLI instalado

---

## 🔧 Passo 1: Instalar Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

---

## 🔐 Passo 2: Login no Supabase

```bash
supabase login
```

Isso vai abrir o navegador para você fazer login.

---

## 🔗 Passo 3: Linkar com seu Projeto

```bash
# Na pasta do projeto
supabase link --project-ref SEU_PROJECT_ID
```

**Como pegar o PROJECT_ID:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. A URL será: `https://supabase.com/dashboard/project/SEU_PROJECT_ID`

---

### **Passo 4: Configurar Secrets (Variáveis de Ambiente)**

```bash
# Configurar API Key do SendGrid
supabase secrets set SENDGRID_API_KEY=SUA_API_KEY_DO_SENDGRID_AQUI

# Configurar email de origem
supabase secrets set FROM_EMAIL=contato@fidelify.com.br
```

---

## 🚀 Passo 5: Deploy da Edge Function

```bash
supabase functions deploy send-email
```

Aguarde a mensagem de sucesso! ✅

---

## ✅ Passo 6: Testar a Edge Function

Você pode testar direto do terminal:

```bash
curl -i --location --request POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer SUA_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "welcome",
    "to": "seu-email@teste.com",
    "data": {
      "name": "Teste",
      "companyName": "Fidelify"
    }
  }'
```

Substitua:
- `SEU_PROJECT_ID` pelo ID do seu projeto
- `SUA_ANON_KEY` pela sua anon key (encontra em Settings > API)

---

## 🔍 Ver Logs da Edge Function

```bash
supabase functions logs send-email
```

---

## ⚙️ Configurar CORS (se necessário)

Se tiver problemas de CORS, adicione sua URL nos headers permitidos:

1. Vá em: Supabase Dashboard > Edge Functions > send-email > Settings
2. Em "Allowed origins", adicione: `http://localhost:3000`

---

## 🧪 Testar no Sistema

Depois do deploy, seus emails vão funcionar automaticamente!

1. Inicie sua aplicação: `npm run dev`
2. Cadastre um cliente com seu email
3. Registre um cashback
4. **Verifique seu email!** 📧

---

## 📊 Monitorar Emails

### Via Edge Function Logs:
```bash
supabase functions logs send-email --tail
```

### Via SendGrid Dashboard:
https://app.sendgrid.com/statistics

---

## ⚠️ Troubleshooting

### "Function not found"
```bash
# Liste as functions
supabase functions list

# Se não aparecer, faça deploy novamente
supabase functions deploy send-email
```

### "Invalid API key"
```bash
# Verifique os secrets
supabase secrets list

# Se não tiver, configure novamente
supabase secrets set SENDGRID_API_KEY=SUA_KEY
```

### "CORS error"
- Verifique se adicionou `http://localhost:3000` nos allowed origins
- O código da Edge Function já tem CORS configurado

---

## 📝 Comandos Úteis

```bash
# Listar funções
supabase functions list

# Ver logs em tempo real
supabase functions logs send-email --tail

# Deletar função
supabase functions delete send-email

# Ver secrets
supabase secrets list

# Remover secret
supabase secrets unset SENDGRID_API_KEY
```

---

## ✅ Checklist de Deploy

- [ ] Supabase CLI instalado
- [ ] Login feito (`supabase login`)
- [ ] Projeto linkado (`supabase link`)
- [ ] Secrets configurados (SENDGRID_API_KEY e FROM_EMAIL)
- [ ] Deploy feito (`supabase functions deploy send-email`)
- [ ] Teste realizado (email recebido)
- [ ] Logs verificados (sem erros)

---

## 🎯 Pronto!

Agora os emails funcionam sem problemas de CORS! 🎉

Quando você registrar um cashback, a sequência será:

```
Frontend (React)
    ↓
Edge Function (Supabase)
    ↓
SendGrid API
    ↓
Email enviado! ✉️
```

**Qualquer erro, veja os logs:**
```bash
supabase functions logs send-email --tail
```
