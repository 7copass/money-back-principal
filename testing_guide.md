# Guia de Testes Definitivo - Pós-Correção

Este guia serve para você validar que a aplicação do script `database_fix.sql` resolveu todos os problemas de login e permissão. Siga os passos abaixo para cada perfil de usuário.

**Importante:** Você precisará de contas de teste com as senhas correspondentes para cada perfil (`MANAGER`, `ADM`, `SELLER`, `USER`). Se não tiver, crie-as diretamente no painel de Autenticação do Supabase.

---

### Teste 1: Login do Gestor (MANAGER)

Este é o teste mais crítico.

*   **Credenciais de Teste:**
    *   **Email:** `manager@moneyback.com` (ou o email do seu usuário gestor)
    *   **Senha:** `senha_segura_manager`

*   **Passo a Passo:**
    1.  Abra a aplicação em uma janela anônima para garantir que não há sessões antigas.
    2.  Faça o login com as credenciais do **MANAGER**.

*   **O que verificar (Resultado Esperado):**
    *   ✅ **Login bem-sucedido:** Você deve ser redirecionado para o "Dashboard do Gestor".
    *   ✅ **Sem loop de login:** A página deve carregar e você **NÃO** deve ser deslogado e enviado de volta para a tela de login. O sistema deve permanecer estável.

---

### Teste 2: Funcionalidades do Gestor (MANAGER)

Após o login bem-sucedido, vamos testar as páginas que antes quebravam.

*   **Passo a Passo (continue logado como MANAGER):**
    1.  No menu lateral, clique em **"Usuários"**.
    2.  Na mesma página, clique no botão **"Criar Usuário"**.
    3.  Preencha o formulário para criar um novo usuário (pode ser um `Vendedor` ou `Administrador`). Use um email de teste que não exista ainda.
    4.  Clique em "Criar Usuário".

*   **O que verificar (Resultado Esperado):**
    *   ✅ **Página de Usuários carrega:** A lista de usuários deve aparecer sem nenhum erro na tela ou no console do navegador. Isso confirma que a função `get_managed_users` está funcionando.
    *   ✅ **Criação de usuário funciona:** O modal de criação deve fechar, e você deve ver uma mensagem de sucesso (ou o novo usuário na lista após recarregar a página).
    *   ✅ **Sessão do Gestor é mantida:** Após criar o usuário, você deve **permanecer logado como MANAGER**. Este é um teste crucial para a lógica de troca de sessão.

---

### Teste 3: Login do Administrador (ADM)

Este teste confirma que as regras de segurança mais simples funcionam para outros perfis.

*   **Credenciais de Teste:**
    *   **Email:** `admin@empresa.com` (ou o email de um usuário ADM)
    *   **Senha:** `senha_segura_adm`

*   **Passo a Passo:**
    1.  Faça logout da conta do MANAGER.
    2.  Faça o login com as credenciais do **ADM**.

*   **O que verificar (Resultado Esperado):**
    *   ✅ **Login bem-sucedido:** Você deve ser redirecionado para o Dashboard da empresa.
    *   ✅ **Sem loop de login:** Assim como o gestor, a página deve permanecer estável sem te deslogar.

---

### Teste 4: Login do Vendedor (SELLER) e Cliente (USER)

Repita o processo de login para os outros perfis para garantir 100% de cobertura.

*   **Credenciais de Teste (Vendedor):**
    *   **Email:** `vendedor@empresa.com`
    *   **Senha:** `senha_segura_seller`

*   **Credenciais de Teste (Cliente Final):**
    *   **Email:** `cliente@email.com`
    *   **Senha:** `senha_segura_user`

*   **O que verificar (Resultado Esperado):**
    *   ✅ **Login bem-sucedido para ambos os perfis:** Cada usuário deve conseguir logar e ver seu respectivo dashboard sem ser deslogado.

---

### Conclusão

Se você conseguiu completar todos os testes acima com sucesso, o sistema está **100% corrigido e estável**. Os problemas de recursão e permissão no banco de dados foram definitivamente resolvidos.
