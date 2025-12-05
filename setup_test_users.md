# Guia Final: Criando Usuários de Teste no Supabase

O erro "Invalid login credentials" significa que os usuários de teste do `testing_guide.md` não existem no seu painel de Autenticação do Supabase ou as senhas estão incorretas.

Este guia mostra como criá-los corretamente. Após seguir estes passos, o login funcionará.

---

### Passo 1: Desabilitar a Confirmação de Email (Temporário)

Para criar usuários de forma rápida, sem precisar confirmar cada email, vamos desabilitar essa função temporariamente.

1.  Acesse seu projeto no **Supabase**.
2.  No menu lateral esquerdo, clique no ícone de **Authentication** (uma chave).
3.  Vá para a aba **Settings**.
4.  Encontre a opção **"Confirm email"** e **desabilite-a** (deixe o toggle cinza).
5.  Clique em **Save** no final da página.



---

### Passo 2: Criar as Contas de Login (Authentication)

Agora, vamos criar as contas que permitirão o login.

1.  Ainda em **Authentication**, vá para a aba **Users**.
2.  Clique no botão verde **"Add user"**.
3.  Crie os seguintes quatro usuários, um de cada vez. Use **exatamente** estas credenciais:

    *   **Usuário 1 (Gestor):**
        *   **Email:** `manager@fidelify.com`
        *   **Password:** `senha_segura_manager`
        *   Clique em "Create user".

    *   **Usuário 2 (Admin):**
        *   **Email:** `admin@empresa.com`
        *   **Password:** `senha_segura_adm`
        *   Clique em "Create user".

    *   **Usuário 3 (Vendedor):**
        *   **Email:** `vendedor@empresa.com`
        *   **Password:** `senha_segura_seller`
        *   Clique em "Create user".

    *   **Usuário 4 (Cliente):**
        *   **Email:** `cliente@email.com`
        *   **Password:** `senha_segura_user`
        *   Clique em "Create user".

Ao final, você terá os quatro usuários na sua lista de Autenticação.

---

### Passo 3: Criar os Perfis no Banco de Dados

Criar o usuário na Autenticação não é suficiente. Precisamos criar o "perfil" dele no banco de dados para definir seu cargo (`role`), nome, etc.

**Primeiro, crie uma empresa de teste:**

1.  No menu lateral, clique no ícone de **Database** (um cilindro).
2.  Selecione a tabela **`companies`**.
3.  Clique em **"+ Insert row"**.
4.  Preencha com dados de teste. Ex:
    *   **name:** `Empresa Teste SA`
    *   **plan:** `Premium`
    *   **cnpj:** `00.000.000/0001-00`
    *   **email:** `contato@empresateste.com`
5.  Clique em **Save**.
6.  **MUITO IMPORTANTE:** Copie o valor da coluna **`id`** da empresa que você acabou de criar. Você precisará dele.

**Agora, crie os perfis:**

1.  Selecione a tabela **`profiles`**.
2.  Clique em **"+ Insert row"** para cada um dos usuários abaixo. Você precisará do **UID** de cada usuário da aba **Authentication -> Users**. É uma boa ideia ter duas abas do navegador abertas.

    *   **Perfil 1: Manager**
        *   Copie o `UID` do usuário `manager@fidelify.com`.
        *   Na tabela `profiles`, clique em "Insert row":
        *   **id:** cole o `UID` aqui.
        *   **name:** `Manager de Teste`
        *   **email:** `manager@fidelify.com`
        *   **role:** `MANAGER`
        *   Deixe o `company_id` em branco (NULL).
        *   Clique em **Save**.

    *   **Perfil 2: Admin**
        *   Copie o `UID` do usuário `admin@empresa.com`.
        *   Na tabela `profiles`, clique em "Insert row":
        *   **id:** cole o `UID` aqui.
        *   **name:** `Admin da Empresa`
        *   **email:** `admin@empresa.com`
        *   **role:** `ADM`
        *   **company_id:** cole o `id` da empresa que você copiou anteriormente.
        *   Clique em **Save**.

    *   **Perfil 3: Seller**
        *   Copie o `UID` do usuário `vendedor@empresa.com`.
        *   Na tabela `profiles`, clique em "Insert row":
        *   **id:** cole o `UID` aqui.
        *   **name:** `Vendedor Teste`
        *   **email:** `vendedor@empresa.com`
        *   **role:** `SELLER`
        *   **company_id:** cole o `id` da mesma empresa.
        *   Clique em **Save**.

    *   **Perfil 4: User**
        *   Copie o `UID` do usuário `cliente@email.com`.
        *   Na tabela `profiles`, clique em "Insert row":
        *   **id:** cole o `UID` aqui.
        *   **name:** `Cliente Final`
        *   **email:** `cliente@email.com`
        *   **role:** `USER`
        *   Deixe o `company_id` em branco (NULL).
        *   Clique em **Save**.

---

### Passo 4: Teste o Login!

Pronto! Agora seus usuários de teste estão 100% configurados.

Volte para a aplicação e siga o guia **`testing_guide.md`**. Todos os logins funcionarão perfeitamente.

Quando terminar os testes, você pode voltar em **Authentication -> Settings** e reativar o **"Confirm email"** se desejar.
