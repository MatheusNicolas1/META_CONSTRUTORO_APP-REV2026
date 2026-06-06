# PRD_ADMIN - P5 validacao de acesso ao Admin

Data: 2026-06-01

## Escopo

Validar por teste automatizado que o acesso ao painel administrativo de metricas segue a decisao operacional vigente:

- somente `matheusnicolas.org@gmail.com` acessa `/app/admin/dashboard`;
- usuario comum nao acessa;
- `Administrador` de organizacao nao ganha metricas globais por engano;
- role `Presidente` sem o e-mail presidencial nao basta para acessar o painel global.

## Implementacao

- Criado `src/utils/__tests__/adminAccess.test.ts`.
- O teste cobre:
  - normalizacao do e-mail presidencial com trim e case-insensitive;
  - identificacao do usuario presidencial pelo objeto de auth;
  - negacao para `Colaborador`, `Administrador` e `Presidente` com e-mails diferentes;
  - permissao para o e-mail presidencial em `/app/admin/dashboard`.

## Validacao

- `npx.cmd eslint src/utils/__tests__/adminAccess.test.ts src/utils/adminAccess.ts src/security/RBACMatrix.ts src/pages/AdminDashboard.tsx src/pages/Perfil.tsx`
  - Resultado: passou sem erros.
- `npx.cmd vitest run src/utils/__tests__/adminAccess.test.ts src/components/security/__tests__/security.test.tsx`
  - Resultado: passou; 2 arquivos de teste e 9 testes.
- `npx.cmd tsc --noEmit --pretty false`
  - Resultado: passou sem erros.

## Resultado

Critérios PRD validados nesta etapa:

- Usuario comum nao acessa `/app/admin/dashboard`.
- Admin de org nao ganha metricas globais por engano.
- Admin autorizado por e-mail presidencial acessa o contrato de rota.
