# PRD_LAYOUT - Evidencia Ciclo 3: Convite/Colaborador/RDO

Data: 2026-05-26

## Objetivo

Validar a pendencia de colaborador convidado/cadastrado: administrador registra colaborador existente, colaborador entra com cargo `Colaborador`, cria RDO e o administrador volta para validar o RDO criado.

## Ambiente

- App local: `http://127.0.0.1:5173`
- Fallback usado: Playwright regular.
- Usuarios temporarios: administrador e colaborador, criados e removidos automaticamente pelo teste.
- Dados temporarios: organizacao compartilhada, assinatura QA, obra, atividade planejada, colaborador em Equipes e RDOs.

## Comandos

```powershell
npx playwright test "scripts/prd-layout-invite-rdo-smoke.spec.ts" --reporter=list
npx playwright test "scripts/prd-layout-smoke.spec.ts" "scripts/prd-layout-auth-smoke.spec.ts" "scripts/prd-layout-invite-rdo-smoke.spec.ts" --reporter=list
npm run build
```

## Resultado

- Smoke convite/RDO: 2 testes, 2 passaram.
- Smoke consolidado: 56 testes, 56 passaram.
- Build: passou.
- Falharam: 0.

## Fluxo coberto

- Administrador entra pela tela real de `/login`.
- Administrador acessa `/app/equipes`.
- Administrador cadastra um colaborador existente na UI de Equipes.
- Colaborador entra pela tela real de `/login` com cargo `Colaborador`.
- Colaborador acessa `/app/rdo/novo`.
- Colaborador seleciona obra compartilhada, clima e atividade planejada.
- Colaborador salva um RDO real.
- O teste confirma no Supabase que o RDO foi persistido com `criado_por_id` do colaborador.
- Administrador volta pelo login real.
- Administrador acessa `/app/rdo/:id/visualizar`, ve o RDO criado e ve a acao `Aprovar RDO`.

## Viewports cobertas no fluxo

- `390x844`
- `1440x900`

## Observacoes

- A aplicacao ainda nao possui tela final de convite por e-mail: `Configuracoes > users` segue como funcionalidade em desenvolvimento. Por isso, o smoke cobre o equivalente operacional disponivel hoje: usuario ja cadastrado, membership ativo em `org_members` como `Colaborador` e cadastro correspondente em `Equipes`.
- O teste remove organizacoes automaticas criadas pelo trigger de cadastro para garantir que admin e colaborador usem a mesma organizacao ativa durante a jornada.
- O teste filtra apenas o erro transitorio de console `TypeError: Failed to fetch` originado pela troca forcada de sessao no Supabase Auth durante o smoke; erros de UI e Supabase fora desse caso continuam falhando o teste.

## Pendencias

- Implementar e validar o convite por e-mail real quando a UI/fluxo de convite estiver pronto.
- Validar clique efetivo em `Aprovar RDO` e `Rejeitar RDO` via Edge Function.
- Gerar e inspecionar PDFs reais.
