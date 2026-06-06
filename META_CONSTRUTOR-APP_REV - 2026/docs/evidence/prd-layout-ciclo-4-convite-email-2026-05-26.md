# Evidencia - PRD_LAYOUT Ciclo 4 - Convite por e-mail

Data: 2026-05-26  
Status: validado localmente

## Escopo

- UI responsiva de convite por e-mail em `/app/configuracoes`, aba `Usuarios`.
- Cargo do convidado restrito a `Colaborador`.
- Convite para usuario novo ou ja cadastrado via Edge Function `invite-member`.
- Ativacao de convites pendentes via Edge Function `accept-invite`.
- Jornada operacional: administrador convida, colaborador cria RDO, administrador volta e visualiza o RDO.

## Arquivos principais

- `src/components/settings/OrgUsersSettings.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/AuthCallback.tsx`
- `src/contexts/OrgContext.tsx`
- `src/hooks/useEquipesSupabase.ts`
- `src/hooks/usePermissions.ts`
- `supabase/functions/invite-member/index.ts`
- `supabase/functions/accept-invite/index.ts`
- `supabase/config.toml`
- `scripts/prd-layout-invite-rdo-smoke.spec.ts`

## Validacoes executadas

### Build

Comando:

```powershell
npm run build
```

Resultado:

- Sucesso.
- Observacoes mantidas do build: `color-adjust` depreciado e aviso conhecido de import dinamico/estatico do cliente Supabase.

### Smoke de convite/RDO

Comando:

```powershell
npx playwright test scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

- 2/2 testes passaram.
- Viewports: `390x844` e `1440x900`.
- Rotas: `/login`, `/app/configuracoes`, `/app/equipes`, `/app/rdo/novo`, `/app/rdo/:id/visualizar`.

### Regressao consolidada PRD_LAYOUT

Comando:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

- 56/56 testes passaram.
- Cobertura: smokes publicos, smokes autenticados, detalhes dinamicos de obra/RDO, persistencia de tema e jornada convite/RDO.

### Checagem local das Edge Functions

Comando:

```powershell
npx supabase functions serve --no-verify-jwt --env-file .env
```

Resultado:

- Bloqueado localmente: Docker Desktop nao esta disponivel neste ambiente.
- Erro observado: `Docker Desktop is a prerequisite for local development`.
- Acao pendente: validar boot real das functions em ambiente com Docker Desktop ou apos deploy no Supabase.

## Criterios confirmados

- Administrador acessa a aba `Usuarios` em Configuracoes.
- Formulario de convite aparece sem overflow horizontal.
- Payload enviado para `invite-member` contem `org_id`, `email`, `name`, `role: "Colaborador"` e `create_team_member: true`.
- Colaborador convidado/cadastrado entra pela tela real de login.
- Colaborador cria RDO real em obra compartilhada.
- RDO fica persistido com `criado_por_id` do colaborador.
- Administrador volta pelo login real e visualiza o RDO criado pelo colaborador.
- Acao `Aprovar RDO` fica disponivel para o administrador na visualizacao.

## Pendencias

- Deploy das Edge Functions `invite-member` e `accept-invite` no Supabase.
- Validar boot real das Edge Functions em ambiente com Docker Desktop ou apos deploy Supabase.
- Validar envio real de e-mail com `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `APP_URL` configurados.
- Validar clique real em `Aprovar RDO` e `Rejeitar RDO`.
- Validar PWA standalone.
- Gerar e inspecionar PDFs reais com dados completos.
