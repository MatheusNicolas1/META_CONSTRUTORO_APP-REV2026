# PRD_LIXEIRA - Evidencia ciclo 2

Data: 2026-05-31

## Objetivo do ciclo

Continuar a execucao do PRD_LIXEIRA fechando a fundacao de seguranca: RLS para esconder registros com `deleted_at` fora da Lixeira, tabela agregadora `lixeira_items` e RPCs para restauracao/exclusao definitiva.

## Alteracoes locais

- Refatorada a migration `supabase/migrations/20260529034950_prd_lixeira_soft_delete_foundation.sql`.
- `public.lixeira_items` passou de view para tabela agregadora com RLS propria.
- Adicionada trigger `app_private.sync_lixeira_item()` para manter a tabela agregadora sincronizada em soft delete/restauracao.
- Adicionadas policies restritivas `deleted_at is null` nas tabelas do primeiro ciclo: `obras`, `documentos`, `rdos`, `checklists`, `atividades`, `expenses`.
- Adicionadas RPCs publicas:
  - `public.restore_lixeira_item(p_entity_type text, p_entity_id uuid)`
  - `public.delete_lixeira_item_permanently(p_entity_type text, p_entity_id uuid)`
- As RPCs delegam para funcoes privadas em `app_private` com checagem de organizacao, papel e prazo de restauracao.
- `src/hooks/useLixeira.ts` foi atualizado para usar as RPCs, em vez de fazer `update/delete` direto nas tabelas operacionais.

## Validacoes executadas

```powershell
supabase.exe --version
```

Resultado: passou. Versao instalada: `2.20.12`.

```powershell
supabase.exe db lint --linked --schema public --fail-on error
```

Resultado: bloqueado antes de conectar ao banco. A CLI instalada nao aceita a configuracao atual `db.major_version: 17`.

```powershell
npm.cmd run lint
```

Resultado: passou com 37 warnings existentes, sem erros.

```powershell
npm.cmd run test
```

Resultado: passou. 8 arquivos de teste, 27 testes.

```powershell
npm.cmd run build
```

Resultado: falhou fora do escopo da Lixeira. Na primeira tentativa o TypeScript reportou import de `@/components/landing/BenefitsSection`; o arquivo existe no checkout. Na segunda tentativa o build parou em `src/integrations/analytics.ts` com erro de sintaxe em arquivo ja modificado fora deste ciclo:

```text
src/integrations/analytics.ts(151,5): error TS1005: ',' expected.
src/integrations/analytics.ts(156,6): error TS1128: Declaration or statement expected.
```

## Pendencias

- Aplicar a migration em ambiente controlado quando a CLI Supabase for atualizada ou quando houver outro caminho de execucao validado.
- Validar fluxo autenticado no navegador: excluir, listar na Lixeira, restaurar, excluir definitivamente.
- Validar policies RLS em runtime com usuarios de papeis diferentes.
- Criar/agendar o job de expurgo automatico e concluir remocao de arquivos do Storage no expurgo.
