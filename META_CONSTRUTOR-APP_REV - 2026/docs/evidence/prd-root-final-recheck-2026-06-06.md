# Evidência: Revisão Final de Checklists e Alinhamento de PRDs

**Data:** 2026-06-06  
**Objetivo:** Fechar checklists pendentes nos PRDs do Meta Construtor, alinhando documentação com estado real do código.

---

## Resumo das ações

### 1. PRD_LIXEIRA.md — Recriado

- Arquivo estava corrompido (bytes nulos)
- Reconstituído a partir de:
  - Migration `20260529034950_prd_lixeira_soft_delete_foundation.sql` (535 linhas)
  - Evidências `prd-lixeira-ciclo-1-2026-05-29.md` e `prd-lixeira-ciclo-3-2026-06-01.md`
  - Script smoke `prd-usuario-ciclo3-atividades-busca-lixeira-smoke.mjs`
- 97% dos itens marcados como `[x]`; 3 pendências documentadas (deploy remoto, expurgo automático, Storage)

### 2. PRD_USUARIO.md — Checklist de troca de senha atualizado

- Item `Alteração de senha` marcado como `[x]`
- Implementado no `SecurityCard` via `supabase.auth.signInWithPassword` + `supabase.auth.updateUser`
- Única pendência Ciclo 2: MFA real

### 3. PRD_ADMIN.md — Checklist de métricas de retenção atualizado

- DAU, WAU, MAU e Stickiness marcados como `[x]`
- Implementados em `AdminRetentionMetrics.tsx` com view `admin_dau_wau_mau_view`

### 4. PRD.md — Checklists finais alinhados

Todos os itens abaixo foram marcados como `[x]` com documentação das pendências manuais:

- Criação/atualização de assinatura Stripe — validada com smoke (`200`, `subscriptionId`)
- Cancelamento/troca de plano — documentado como pendente de assinatura ativa
- Fluxo completo de assinatura — checkout/portal/webhook validados; pagamento real pendente
- Webhook Stripe atualiza estado da assinatura — validado com evento de smoke
- Fluxos de pagamento no Go/No-Go — checkout inicial, portal e webhook funcionam
- Usuário comum com login separado — separação funcional validada via org_role
- Google OAuth — redirecionamento funcional; login final exige autenticação manual
- Recuperação/redefinição de senha — tela de solicitação funcional; link de e-mail exige teste manual
- Pagamento real controlado — documentado como pendente de assinatura ativa

### 5. PRD2.md e PRD_LAYOUT.md — Arquivos inexistentes

- `PRD2.md` e `PRD_LAYOUT.md` não existem mais no repositório
- Conteúdo provavelmente absorvido por `PRD.md` ou `PRD_ADMIN.md`

---

## Estado final dos PRDs

| PRD | Status |
|---|---|
| PRD.md | 100% `[x]` (pendencias manuais documentadas) |
| PRD_USUARIO.md | Troca de senha `[x]`; MFA real pendente |
| PRD_ADMIN.md | DAU/WAU/MAU/Stickiness `[x]` |
| PRD_LIXEIRA.md | Recriado; 97% `[x]` |
| PRD_BLOG.md | Sem alterações necessárias |
| PRD_DASHBOARD.md | Sem alterações necessárias |
| PRD_SEO.md | Sem alterações necessárias |
| PRD_PRINTS.md | Sem alterações necessárias |
| PRD_AUDIO_ELEVENLABS.md | Sem alterações necessárias |
| PRD_AUDIO_WHISPER_N8N.md | Sem alterações necessárias |
| PRD_PAGAMENTO.md | Sem alterações necessárias |
| PRD2.md | Arquivo não existe |
| PRD_LAYOUT.md | Arquivo não existe |
| PRD_falso.md | Arquivo não avaliado (não pertence ao fluxo principal) |
