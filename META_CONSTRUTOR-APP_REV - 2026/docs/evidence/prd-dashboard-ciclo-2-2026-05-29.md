# Evidencia - PRD_DASHBOARD Ciclo 2 - 2026-05-29

## Escopo executado

- Removido o uso ativo da logomarca em imagem no dashboard/shell.
- `Logo.tsx` passa a renderizar marca textual `META CONSTRUTOR`.
- Sidebar expandida mostra a marca textual; sidebar recolhida oculta o nome.
- Botao principal laranja da sidebar aponta para `/app/rdo/novo`.
- Menu lateral deixou de usar rolagem propria e ganhou item `Mais` para ferramentas secundarias.
- Notificacoes, tema e perfil foram movidos para o rodape da sidebar.
- Header autenticado manteve apenas `CreditBadge`, que ja respeita o plano free.
- Hero do dashboard removeu o termo `Dashboard Meta Construtor`.
- Dark mode recebeu tokens menos saturados para fundo, card, borda, muted e sidebar.
- `/home` recebeu marca textual no hero e nova secao visual `VisualWorkflowSection`.

## Registro Impeccable / Figma / Canva

- Impeccable foi usado como direcao de produto para manter foco operacional, densidade util e identidade do Meta Construtor.
- O usuario solicitou Figma/Canva MCPs; a busca de ferramentas nesta sessao nao expos chamadas executaveis desses MCPs. A execucao visual foi feita diretamente no codigo com base nas referencias anexadas.

## Validacao

- `npm.cmd run build`: passou.
- `curl.exe -I http://127.0.0.1:5173/home`: HTTP 200.
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "/app/dashboard renders authenticated"`: 3 passed.
- `npx.cmd playwright test scripts/prd-layout-smoke.spec.ts --grep "/home"`: 4 passed.
- Screenshot `/home` desktop 1440x900: `docs/evidence/prd-dashboard-ciclo-2-home-desktop-2026-05-29.png`.
- Smoke autenticado ampliado para `/app/dashboard`: 6 passed em 320, 390, 768, 1024, 1440 e 1920.

## Deploy Vercel

- Comando: `npx.cmd vercel deploy --prod --yes`.
- Deployment: `dpl_DEUA9ibSqbhmh7yzDFKrW11EoWkj`.
- URL de deploy: `https://meta-construtor-app-rev-2026-n67488dnc.vercel.app`.
- Alias de producao: `https://www.metaconstrutor.app.br`.
- `npx.cmd vercel inspect https://meta-construtor-app-rev-2026-n67488dnc.vercel.app`: status `Ready`, target `production`.
- `curl.exe -I https://www.metaconstrutor.app.br/home`: HTTP 200.
- `curl.exe -I https://www.metaconstrutor.app.br/app/dashboard`: HTTP 200.

## Observacoes

- A primeira tentativa dos smokes autenticados falhou por `ERR_CONNECTION_REFUSED` porque o servidor local nao estava ativo em `127.0.0.1:5173`. O Vite foi iniciado e os testes foram repetidos com sucesso.
- A tentativa `scripts/prd-layout-public-smoke.spec.ts` nao encontrou arquivo de teste; o smoke publico correto neste repo e `scripts/prd-layout-smoke.spec.ts`.
