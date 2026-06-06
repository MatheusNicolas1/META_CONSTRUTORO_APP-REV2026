# PRD_LIXEIRA - Evidencia ciclo 3

Data: 2026-06-01

## Objetivo do ciclo

Continuar a execucao do PRD_LIXEIRA removendo o bloqueio de build, revalidando a aplicacao local e fazendo smoke da rota `/app/lixeira`.

## Ajustes realizados

- `src/hooks/useLixeira.ts`: a exclusao definitiva de documentos agora chama primeiro a RPC `delete_lixeira_item_permanently` e so depois tenta remover o arquivo do Storage. Isso evita tentativa de remocao de arquivo antes da validacao de permissao no banco.

## Validacoes executadas

```powershell
npm.cmd run lint
```

Resultado: passou com 32 warnings existentes, sem erros.

```powershell
npm.cmd run test
```

Resultado: passou. 10 arquivos de teste, 33 testes.

```powershell
npm.cmd run build
```

Resultado: passou. O postbuild gerou sitemap e prerenderizou 15 rotas publicas. Permanecem apenas warnings nao bloqueantes do Vite/CSS.

```powershell
supabase.exe db push --dry-run --linked
```

Resultado: bloqueado antes de executar qualquer operacao por incompatibilidade da CLI instalada com `db.major_version = 17`.

```text
Failed reading config: Invalid db.major_version: 17.
```

## Smoke de rota

Rota testada: `http://127.0.0.1:5173/app/lixeira`

Resultado observado no navegador local:

- URL final: `/app/lixeira`.
- Titulo: `Meta Construtor`.
- Pagina renderizou a Lixeira com total `0`, recuperaveis `0`, expirados `0`.
- Estado vazio exibido: `Nenhum item na Lixeira`.
- Nenhum erro de console capturado no smoke.

Observacao: a captura de tela via ferramenta de navegador falhou por timeout no comando de screenshot, mas o DOM e os logs da pagina foram coletados com sucesso.

## Referencias Supabase consultadas

- Supabase Row Level Security: confirma que tabelas em schemas expostos devem ter RLS, que `UPDATE` precisa de policy `SELECT` correspondente e que views podem contornar RLS por padrao.
- Supabase Database Functions: confirma boas praticas para funcoes com `security definer` e `search_path`.

## Pendencias

- Atualizar a Supabase CLI ou usar outro executor SQL validado para aplicar a migration no projeto remoto/controlado.
- Validar em runtime as policies/RPCs com usuario autenticado e papeis diferentes.
- Concluir job de expurgo automatico e estrategia reprocessavel para falhas de Storage.
