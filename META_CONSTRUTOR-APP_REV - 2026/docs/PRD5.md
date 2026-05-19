# PRD5 – CORREÇÃO DE FUNCIONALIDADES MOCKADAS (NÃO REMOVER NADA – FAZER FUNCIONAR)

**Versão:** 2.0
**Data:** 29/04/2026
**Status:** A EXECUTAR
**Objetivo:** Transformar todas as funcionalidades atualmente mockadas (toasts, console.log, placeholders) em recursos reais e operacionais. Nada será removido ou ocultado – tudo deve funcionar.

**RESULTADO FINAL ESPERADO:**
Ao final da execução, cada botão, formulário e ação visível no MVP executará uma operação concreta (persistência, edição, download, envio, aprovação). Nenhum "em breve", toast inútil, console.log ou clique morto permanecerá.

---

## REGRAS GERAIS (MODO CAVEMAN)

1. **Zero mensagens "em breve"** – substituir por lógica real.
2. **Zero console.log como ação** – substituir por chamadas a Supabase ou Edge Functions.
3. **Zero cliques mortos** – todo botão `onClick` deve executar uma operação útil.
4. **Zero placeholders "TODO"** – implementar ou conectar ao backend.
5. **Persistência obrigatória** – tudo que é editado ou enviado deve salvar no banco.

---

## 1. FUNCIONALIDADES A CORRIGIR (SEM REMOVER NADA)

### 1.1 Relatórios (`Relatorios.tsx`)
- **Problema:** Relatórios "Financeiro Consolidado" e "Cronograma vs Realizado" mostram toast "em breve". Botões download sem ação.
- **Correção:** Implementar ambos os relatórios com dados reais do banco:
  - "Financeiro Consolidado": somar despesas por obra, período, categoria.
  - "Cronograma vs Realizado": comparar datas planejadas vs reais das atividades.
- **Botões download:** Conectar ao `handleExportCSV` gerando CSV com dados do relatório.

### 1.2 Integrações (`Integracoes.tsx`)
- **Problema:** Texto fixo "será disponibilizada em breve".
- **Correção:** Implementar integração real com pelo menos um serviço (ex: WhatsApp, Gmail, Google Drive). Criar Edge Functions para envio de mensagens ou e-mails.

### 1.3 Contato (`Contato.tsx`)
- **Problema:** `console.log(formData)`
- **Correção:** Criar Edge Function `send-contact` que insere dados na tabela `contacts`. Frontend envia via `fetch`.

### 1.4 Feedback (`Feedback.tsx`)
- **Problema:** Salva apenas em estado local.
- **Correção:** Criar tabela `feedbacks` no Supabase. Conectar mutation `insert`.

### 1.5 CRUDs (Documentos, Fornecedores, Equipes, Equipamentos)
- **Problema:** Edição exibe `console.log` ou alerta.
- **Correção:** Implementar modal de edição (Dialog) com campos preenchidos. Atualizar via mutation `update` no Supabase.

### 1.6 Assinatura digital RDO (`RDOApprovalSection.tsx`)
- **Problema:** `// TODO: usar ID real do criador`, sem persistência.
- **Correção:** Criar Edge Function `approve-rdo`. Chamar com ID real do RDO e usuário logado. Atualizar `aprovado_por_id`, `data_aprovacao`, status.

### 1.7 Assinatura Checklist (`Checklist.tsx`)
- **Problema:** `console.log("Signing checklist")`.
- **Correção:** Adicionar colunas `approved_by`, `approved_at` na tabela `checklists`. Criar Edge Function `approve-checklist`.

---

## 2. ESPECIFICAÇÕES TÉCNICAS (COMO FAZER FUNCIONAR)

### 2.1 Relatórios ("Financeiro Consolidado" e "Cronograma vs Realizado")
- **Backend:** Criar view ou função SQL (ex: `financeiro_consolidado`) que retorna os dados somados.
- **Frontend:** `useQuery` para buscar dados da view. Renderizar tabela com totais.
- **Download:** Gerar CSV dos mesmos dados.

### 2.2 Integrações (ex: WhatsApp Business)
- **Edge Function `send-whatsapp`:** Recebe `to`, `message`. Chama API do WhatsApp Business (ou Twilio). Retorna status.
- **Frontend:** Formulário simples para testar envio. Remover texto "em breve".

### 2.3 Contato e Feedback – tabelas e endpoints
```sql
-- Tabela contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela feedbacks
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Permissões, Auditoria e Autenticação (Ajustes Finais)
- **RBAC (`useUserPermissions.ts`)**: Remover o mock de permissões locais e consultar uma tabela `user_roles` ou os *app_metadata* do usuário no Supabase.
- **Auditoria (`AuditLogger.tsx`)**:
```sql
-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Navegação (Sign In / Sign Up)**: Substituir os links com `href="#"` e *preventDefault* por navegação real (usando o Router adotado pela aplicação, como `useNavigate` do `react-router-dom`) para as rotas corretas (`/login`, `/nova-conta`, `/recuperar-senha`).

### 2.5 Assinaturas (RDO e Checklist)
- Garantir a modificação nas tabelas existentes para comportar as aprovações.
```sql
-- Adicionar controle de assinatura no RDO (se não existir)
ALTER TABLE rdos ADD COLUMN IF NOT EXISTS aprovado_por_id UUID REFERENCES auth.users(id);
ALTER TABLE rdos ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ;

-- Adicionar controle de assinatura em Checklists (se não existir)
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS aprovado_por_id UUID REFERENCES auth.users(id);
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ;
```
- A lógica do front-end deve extrair o ID do usuário diretamente de `const { user } = useAuth()` ou semelhante em vez de usar strings estáticas (`'creator-id'`).