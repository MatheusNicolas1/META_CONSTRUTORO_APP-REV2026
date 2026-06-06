# PRD_USUARIO - Ciclo 3 - Estados de erro de upload

Data: 2026-06-03

## Escopo

Complementar o aceite de `P0.7 - Documentos e anexos` para estados de erro de upload, sem depender de envio real externo.

## Alteracoes realizadas

- Criado `src/utils/documentUploadValidation.ts` com contrato unico de upload:
  - extensoes permitidas: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG e PNG;
  - limite maximo: 50MB;
  - mensagem clara para tipo invalido;
  - mensagem clara para arquivo acima de 50MB;
  - `accept` e texto de ajuda compartilhados pelas telas.
- `src/hooks/useDocuments.ts` passou a usar o validador compartilhado antes do upload.
- `src/pages/Documentos.tsx` passou a usar o mesmo `accept` e texto de ajuda.
- `src/pages/ObraDetalhes.tsx` passou a usar o mesmo `accept` e exibir texto de ajuda abaixo do input.
- Criado `src/utils/__tests__/documentUploadValidation.test.ts`.

## Validacoes

### Teste unitario

Comando:

```powershell
npm.cmd test -- src/utils/__tests__/documentUploadValidation.test.ts
```

Resultado:

```text
Test Files  1 passed (1)
Tests       4 passed (4)
```

Cobertura do teste:

- extensao normalizada e aceita;
- tipo de arquivo nao permitido bloqueado com mensagem clara;
- arquivo acima de 50MB bloqueado com mensagem clara;
- `accept` e texto de ajuda consistentes com TXT e limite de 50MB.

### TypeScript

Comando:

```powershell
npx.cmd tsc -p tsconfig.app.json --noEmit
```

Resultado: passou.

### Build

Comando:

```powershell
npm.cmd run build
```

Resultado: passou.

Avisos residuais conhecidos:

- `color-adjust` depreciado em CSS de impressao.
- import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

## Relacao com evidencia responsiva anterior

Os fluxos negativos de tipo invalido e arquivo acima de 50MB ja tinham sido exercitados em PC, tablet e mobile na evidencia `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Esta evidencia fecha a regressao automatizada do contrato de erro e remove a divergencia entre formatos aceitos pelo hook e formatos oferecidos pela UI.

## Status

Item `Estados de erro de upload sao claros`: aprovado para o escopo automatizavel.

Permissoes de leitura/escrita por organizacao continuam abertas ate aplicar a migracao remota `20260603090000_prd_usuario_documentos_org_rls.sql`.
