# PRD_ADMIN - Acesso presidencial ao painel de metricas

Data: 2026-06-01

## Solicitacao

Disponibilizar o acesso ao painel de metricas somente para a conta presidencial `matheusnicolas.org@gmail.com` e posicionar o ponto de entrada na tela `Meu Perfil`, ao lado da aba `Seguranca`.

## Implementacao

- `src/utils/adminAccess.ts`
  - adiciona `PLATFORM_PRESIDENT_EMAIL`;
  - adiciona `isPlatformPresidentEmail`;
  - adiciona `isPlatformPresidentUser`.
- `src/pages/Perfil.tsx`
  - adiciona a aba condicional `Métricas` apenas para o e-mail presidencial;
  - inclui botao de acesso para `/app/admin/dashboard`.
- `src/pages/AdminDashboard.tsx`
  - passa a validar acesso por `isPlatformPresidentUser(user)`.
- `src/components/admin/AdminManagers.tsx`
  - usa a mesma regra por e-mail para a gestao interna de admins.
- `src/components/AppSidebar.tsx`
  - remove o atalho antigo `Painel Admin` do menu lateral.
- `src/components/PerformanceOptimizedApp.tsx`
  - remove a exigencia de role `Presidente` no wrapper da rota para permitir que a pagina aplique a regra por e-mail.
- `src/security/RBACMatrix.ts`
  - registra a rota administrativa como permissao por e-mail presidencial.

## Criterios de aceite

- A aba `Métricas` aparece em `Meu Perfil` apenas para `matheusnicolas.org@gmail.com`.
- Usuarios comuns nao veem o atalho de metricas no Perfil.
- O menu lateral nao mostra mais `Painel Admin`.
- A rota `/app/admin/dashboard` redireciona usuarios autenticados que nao sejam o e-mail presidencial.

## Validacao

- `npx.cmd eslint src/pages/Perfil.tsx src/pages/AdminDashboard.tsx src/components/AppSidebar.tsx src/components/admin/AdminManagers.tsx src/components/PerformanceOptimizedApp.tsx src/security/RBACMatrix.ts src/utils/adminAccess.ts`
  - Resultado: passou sem erros.
- `npx.cmd tsc --noEmit --pretty false`
  - Resultado: passou sem erros.
- `npm.cmd run build`
  - Resultado: passou, com avisos nao bloqueantes ja conhecidos do Vite sobre `color-adjust` depreciado e import dinamico/estatico do client Supabase.
- `npx.cmd vitest run src/components/security/__tests__/security.test.tsx src/test/comprehensive-security-test.ts`
  - Resultado: passou; Vitest executou 1 arquivo de teste e 5 testes.
