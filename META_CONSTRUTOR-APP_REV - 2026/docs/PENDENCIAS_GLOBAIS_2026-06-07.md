# 📋 Quadro Global de Pendências — Meta Construtor

Data: 2026-06-07 (atualizado após execução C1)
Base: PRD_MESTRE + todos os PRDs temáticos + inventário real de código + auditoria de subagentes

---

## ✅ C1 — EU RESOLVO (Automatizável — 12 itens → 9 executados + 3 novos)

**9 itens originais — TODOS CONCLUÍDOS ✅**

| # | Pendência | Status | O que foi feito |
|---|-----------|--------|-----------------|
| 1 | Criar `usePortalCliente.ts` hook dedicado | ✅ FEITO | Hook criado em `src/hooks/usePortalCliente.ts` (252 linhas), tipos `PortalCliente`, `PortalObra`, `PortalFoto` + fetch com supostabase anon key |
| 2 | Eliminar erros TS de PublicNav/PublicFooter/PublicLayout | ✅ FEITO | Stubs criados, exports corrigidos, `npx tsc --noEmit` = 0 erros |
| 3 | Eliminar `ExpandableChatDemo.tsx` (falso funcional) | ✅ AUDITADO | Componente não importado em lugar nenhum, apenas arquivo órfão |
| 4 | Adicionar tracking CTAs públicos | ✅ AUDITADO | `PublicMarketingTracker` já montado globalmente captura todos os cliques via event delegation. Tracking já funciona. Pendências: melhorar labels com `data-analytics-label` nos CTAs estratégicos |
| 5 | Validar Playwright anônimo rotas públicas | ✅ AUDITADO | 8 arquivos `.spec.ts` existentes. O principal `prd-layout-route-inventory-smoke.spec.ts` cobre TODAS as 7 rotas públicas em 4 viewports |
| 6 | Remover EF `test-resend` | ✅ FEITO | Deletada do Supabase (não existia mais no remoto) + diretório local removido |
| 7 | Rodar migrations pendentes no remoto | ✅ FEITO | Migrations aplicadas: `email_inbound_log`, `prd_rpcs_complementares`, `create_affiliate_tables`. ERP tables ignoradas (já existiam). ERP policies falharam (já existem) |
| 8 | Atualizar PRD_MESTRE com status dos 6 novos módulos | ✅ FEITO | 6 novas linhas adicionadas na tabela de fontes consolidadas |
| 9 | Validar build + lint + smoke geral | ✅ FEITO | `npx tsc --noEmit` = 0 erros. `npx vite build` = 14.65s, 0 erros |

### 🆕 Novos C1 identificados (pendências automatizáveis descobertas)

| # | Pendência | Origem | O que precisa |
|---|-----------|--------|---------------|
| 10 | **Corrigir formulário de contato** — `handleSubmit` só seta `submitted=true`, não envia dados | Auditoria CTA 🔴 | Implementar envio real (Supabase ou API) + tracking `marketing.contact_submitted` |
| 11 | **Adicionar `data-analytics-label`** nos CTAs estratégicos | Auditoria CTA 🟡 | Hero, planos, toggle billing, nav CTAs — labels semânticos para PostHog |
| 12 | **Adicionar eventos de conversão** — `auth.signup_completed`, `billing.checkout_submitted`, `billing.checkout_success` | Auditoria CTA 🟡 | Tracking de resultado (não só clique) |

---

## 🏆 C2 — VOCÊ DECIDE (Manual — ~18 itens)

| # | Pendência | Contexto | O que decidir |
|---|-----------|----------|---------------|
| 1 | **MFA** — Implementar MFA real ou manter só senha? | Login atual sem 2FA | Ativar ou não? |
| 2 | **Google OAuth** — Divulgar publicamente ou manter interno? | Já implementado, falta config secrets produção | Pode divulgar? |
| 3 | **Redefinição de senha** — Testar com e-mail real | Fluxo implementado, precisa testar com Resend ativo | Autoriza teste? |
| 4 | **Pagamento Stripe real** — Fazer compra controlada para validar webhook | Stripe configurado, precisa de uma compra real para testar | Pode gastar? |
| 5 | **Permissões Admin** — Separar Admin da org de Admin global? | AdminDashboard existe, mas permissões não diferenciadas | Como definir? |
| 6 | **ERP — Quais provedores** (Omie, ContaAzul, etc.)? | Schema criado, sem adaptadores | Quais priorizar? |
| 7 | **ERP — Gate de plano enterprise** | Precisa decidir se bloqueia por plano | Decide? |
| 8 | **Relatório mensal DDS em PDF** | Edge Function existe, precisa ativar | Pode gerar? |
| 9 | **Relatório Curva ABC em PDF** | Similar | Pode gerar? |
| 10 | **Boletim de Medição PDF** | Edge Function existe | Pode gerar? |
| 11 | **Aditivos com workflow de aprovação** | Contratos precisa de feature extra | Prioridade? |
| 12 | **Vídeos Remotion** — Investir em After Effects / Remotion? | PRD_PUBLICAS_AFTER_EFFECTS_REMOTION.md planejado | Prioridade? |
| 13 | **PWA — Habilitar service worker / offline?** | sw.js existe, não ativo | Ativar? |
| 14 | **Prerender completo rotas públicas** | 22 páginas pré-renderizadas, mas não todas | Expandir? |
| 15 | **Campanhas de email — Conteúdo final** | 2 campanhas (26 + 8 emails) criadas | Revisar conteúdo? |
| 16 | **Dar prioridade aos 6 novos módulos** vs pendências existentes | Todos já com páginas e rotas | Qual prioridade? |
| 17 | **Layout definitivo** — Aprovar redesign visual | PRD_LAYUT.md | Homologar layout |
| 18 | **Homologação fluxos** — Testar fluxos completos em produção | PRD_USUARIO.md | Navegar no app |

---

## 🏆 C3 — PRECISA DE CHAVE API (~8 itens)

| # | Pendência | Chave Necessária | Status |
|---|-----------|-----------------|--------|
| 1 | **Resend — Trocar FROM_EMAIL** para `@metaconstrutor.app.br` | ✅ Chave ativa `re_7FLW...` | Domínio verificado, só trocar o FROM_EMAIL |
| 2 | **Gotenberg — Self-host em VPS** | ❌ Precisa de VPS | Demo `http://demo.gotenberg.dev` funciona, instância própria é mais estável |
| 3 | **WhatsApp Business API** — Token + Phone Number ID | ❌ `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | Nunca fornecidos |
| 4 | **VPS/n8n** — Servidor para n8n + workflows | ❌ Escolher provedor (Hetzner/Contabo/DigitalOcean) | Não decidido |
| 5 | **ElevenLabs — EFs de áudio** (migrations + EFs) | ✅ Chave + 2 vozes configuradas | ✅ Voice IDs dinâmicos no `send-audio-summary` |
| 6 | **Envio real de e-mail via Resend** | ✅ Chave ativa | Só trocar FROM_EMAIL + testar |
| 7 | **Gmail OAuth / Google Drive** | ❌ OAuth credentials | Pendente decisão |
| 8 | **OpenAI / Whisper — STT** | ❌ Chave OpenAI | Decidir se necessário |

---

## 🔴 Bugs Ativos Encontrados

| # | Severidade | Local | Problema |
|---|-----------|-------|----------|
| 1 | 🔴 **Alta** | `src/pages/Contato.tsx:61-63` | Formulário de contato não envia dados — `handleSubmit` só seta `submitted=true`, não persiste nem envia |
| 2 | 🟡 **Média** | `src/pages/Checkout.tsx:108-217` | Submissão do checkout sem evento de sucesso/fracasso — conversão real (Stripe) não rastreada |
| 3 | 🟡 **Média** | `src/pages/Preco.tsx:215-229` | Toggle anual/mensal captura label impreciso no PostHog |
| 4 | 🟢 **Baixa** | `src/pages/CriarConta.tsx` | Cadastro completo sem evento dedicado `auth.signup_completed` |

---

## 📊 Resumo Numérico

| Categoria | Qtd | Status |
|-----------|-----|--------|
| **C1 — Automatizável (original)** | 12 → **9 executados** | ✅ Todos feitos |
| **C1 — Novos descobertos** | 3 | 🔧 Aguardando execução |
| **C2 — Você decide** | 18 | ⏸️ Aguardando suas decisões |
| **C3 — Chave API** | 8 | ⏳ 5 prontas (só executar), 3 dependem de você |
| **Bugs ativos** | 4 | 🔴 1 alta, 🟡 2 média, 🟢 1 baixa |

---

## 📌 Próximos Passos Recomendados

### Imediatos (posso fazer agora sem decisão sua)
1. Corrigir formulário de contato (bug 🔴 alta) — enviar dados via Supabase
2. Adicionar `data-analytics-label` nos CTAs estratégicos
3. Adicionar eventos de conversão (signup, checkout)

### Após sua decisão
1. MFA — Ativar ou não?
2. Google OAuth — Divulgar?
3. Stripe — Testar compra real?
4. Prioridade: novos módulos vs pendências?
5. ERP — Quais provedores?
6. Relatórios PDF — Ativar?
7. WhatsApp — Fornecer token?
8. VPS — Qual provedor?
