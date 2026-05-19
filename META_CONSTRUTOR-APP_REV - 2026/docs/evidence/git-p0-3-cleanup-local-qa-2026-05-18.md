# Evidencia P0.3 - Limpeza fisica e QA local

Data: 2026-05-18
Escopo: remover apenas artefatos nao rastreados/ignorados e validar que o app web continua funcional localmente.

## Estrutura lida antes da limpeza

Aplicacao:

- Vite + React + TypeScript.
- Entrada: `src/main.tsx` -> `src/bootstrap.tsx` -> `src/components/PerformanceOptimizedApp.tsx`.
- Rotas publicas principais: `/home`, `/login`, `/criar-conta`, `/preco`, `/sobre`, `/contato`, `/checkout`, paginas legais e suporte.
- Rotas autenticadas principais: `/app/dashboard`, `/app/obras`, `/app/rdo`, `/app/checklist`, `/app/equipes`, `/app/documentos`, `/app/fornecedores`, `/app/despesas`, `/app/relatorios`, `/app/integracoes`, `/app/configuracoes`, `/app/perfil`.
- Supabase: `supabase/functions/` com Edge Functions e `supabase/migrations/` com historico de schema.
- Assets publicos: `public/`, incluindo `public/prints-publicitarios/`.

## Pre-validacao dos arquivos a apagar

Antes de apagar, cada caminho foi validado com:

- caminho resolvido dentro do repositorio;
- `git ls-files` sem retorno para o caminho;
- item classificado como artefato/cache gerado.

Arquivos/diretorios apagados:

- `.playwright-cli/`
- `output/`
- `dist/`
- `test-results/`
- `screenshot_fail.png`
- `vite.config.ts.timestamp-1778597929192-563554aebff778.mjs`
- `vite.config.ts.timestamp-1778597948481-8c121ef7237f3.mjs`
- `supabase/.temp/linked-project.json`
- `../META_CONSTRUTOR-APP_REV - 2026 (2).zip`

Arquivos rastreados ou potencialmente sensiveis preservados:

- `.env`, `.env.local`
- `.release-backups/`
- `node_modules/`
- `supabase/.temp/*` rastreados pelo Git
- `tsconfig*.tsbuildinfo` rastreados pelo Git
- todo `src/`, `public/`, `supabase/functions/`, `supabase/migrations/`, `package*.json` e configuracoes

Confirmacao pos-limpeza:

- Os caminhos apagados nao aparecem mais em `git status --porcelain`.
- `dist/` foi recriado posteriormente por `npm run build`, como esperado.

## Validacoes automatizadas

```text
npm test
Test Files 3 passed (3)
Tests 10 passed (10)

npm run lint
33 problems (0 errors, 33 warnings)

npm run build
built in 9.79s
```

Warnings aceitos:

- Lint: 33 warnings ja documentados na P0.2.
- Build: `color-adjust` depreciado, import dinamico/estatico misto do cliente Supabase e chunks acima de 500 kB.

## QA local renderizado

Servidor local:

- URL: `http://127.0.0.1:5173/`
- Processo: Vite rodando localmente na porta `5173`.

Fluxo testado:

`/home` -> clique em `Preco` -> `/preco` -> clique em `Login` -> `/login` -> preenchimento do campo de e-mail/celular.

Checks:

- Pagina `/home` carregou com titulo `Meta Construtor`.
- DOM nao estava vazio e exibiu hero, navegacao, CTA e mock de RDO.
- Console do navegador sem erros/warnings relevantes.
- Clique em `Preco` navegou para `/preco`.
- Pagina `/preco` carregou com titulo `Planos e Precos | Meta Construtor`.
- Clique em `Login` navegou para `/login`.
- Pagina `/login` carregou com titulo `Login | Meta Construtor`.
- Botao `Continuar com Google` visivel.
- Campo `Digite seu e-mail ou celular` aceitou o valor `qa.local@example.com`.

Screenshots capturados fora do repositorio:

- `C:\Users\nicol\AppData\Local\Temp\meta-construtor-home-5173.png`
- `C:\Users\nicol\AppData\Local\Temp\meta-construtor-preco-5173.png`
- `C:\Users\nicol\AppData\Local\Temp\meta-construtor-login-5173.png`

## Estado restante

P0.3 ainda nao deve criar commit/tag automaticamente:

- Existem 24 arquivos `MM`.
- Ainda e necessario reconciliar stage vs working tree antes de um commit reproduzivel.
