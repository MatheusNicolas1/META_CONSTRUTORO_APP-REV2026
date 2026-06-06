# Evidencia - PRD_DASHBOARD Ciclo 4 - Sidebar Canva-like - 2026-05-29

## Escopo executado

- `AppSidebar.tsx` reestruturado para o comportamento dos prints: trilho fixo de icones e painel detalhado que aparece apenas no menu expandido.
- Larguras ajustadas em `src/components/ui/sidebar.tsx`: `5.5rem` recolhido, `25.5rem` expandido e `22rem` em drawer mobile.
- Marca `Meta Construtor` movida para o painel lateral expandido; o trilho recolhido fica apenas com o icone do menu, como nos prints.
- Botao principal laranja mantido como criacao de novo RDO em `/app/rdo/novo`.
- `Mais` permanece no trilho em ambos os estados e abre dropdown com ferramentas secundarias.
- Notificacoes, modo dark/light e perfil foram reorganizados no rodape do trilho, sem texto lateral que possa cortar.
- `Logo.tsx` passou a usar `Balgeri` como tipografia preferencial local para `Meta`, com fallback para `Gristela`, `Rosca`, `Moonet`, `Casser` e cursiva do sistema.
- Nenhum arquivo de fonte foi embutido no repositorio; a fonte e carregada via `local()` para evitar incluir fonte sem licenca comercial validada.
- Tokens do dark mode foram suavizados para fundo, cards, bordas e sidebar.
- Calendario ajustado em 768 px: padding do card reduzido antes de `2xl` e celulas grandes do calendario movidas de `md` para `lg`.
- Smoke autenticado agora tambem valida que o botao de perfil nao fica cortado no dashboard desktop/tablet.

## Validacao local

- `npm.cmd run build`: passou.
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "/app/dashboard renders authenticated"`: 6 passed em 320, 390, 768, 1024, 1440 e 1920.
- `npx.cmd playwright test scripts/prd-layout-smoke.spec.ts --grep "/home"`: 4 passed em 320, 390, 768 e 1440.

## Deploy Vercel

- Comando: `npx.cmd vercel deploy --prod --yes`.
- Deployment: `dpl_Hu2xmMgUVoLu1XJoDuhQnAy7wT7s`.
- URL de deploy: `https://meta-construtor-app-rev-2026-gvudw8pkf.vercel.app`.
- Alias de producao: `https://www.metaconstrutor.app.br`.
- `npx.cmd vercel inspect https://meta-construtor-app-rev-2026-gvudw8pkf.vercel.app`: status `Ready`, target `production`.
- `curl.exe -I https://www.metaconstrutor.app.br/home`: HTTP 200.
- `curl.exe -I https://www.metaconstrutor.app.br/app/dashboard`: HTTP 200.

## Observacoes

- O primeiro smoke do dashboard falhou em 768 px por overflow interno de 15 px no card do calendario. A falha foi corrigida no mesmo ciclo e o smoke foi repetido com sucesso.
- A tipografia `Balgeri` so sera exibida para usuarios que tenham a fonte instalada localmente ou quando um arquivo licenciado for adicionado futuramente ao projeto.
