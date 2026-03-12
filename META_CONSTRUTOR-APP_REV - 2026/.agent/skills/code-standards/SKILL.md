---
name: code-standards
description: Verifica se o código segue os padrões de nomenclatura e organização do projeto. Use ao iniciar revisão de código ou antes de commits.
---

# Code Standards Skill

## Quando usar
- Antes de commits
- Ao revisar PRs
- Antes de deploys

## Padrões do Projeto

### Nomenclatura de Arquivos
- Componentes/Páginas: PascalCase (Button.tsx)
- Hooks: camelCase com prefixo "use" (useAuth.ts)
- Utilitários: kebab-case (format-date.ts)
- Types: PascalCase (UserTypes.ts)

### Nomenclatura no Banco
- Tabelas: snake_case plural (obras, rdos)
- Colunas: snake_case (created_at, org_id)
- Enums: snake_case (obra_status)

## Passo a Passo

1. Verificar arquivos:
node .agent/skills/code-standards/scripts/check-file-naming.js

2. Verificar banco:
node .agent/skills/code-standards/scripts/validate-db-naming.js

3. Corrigir problemas encontrados

## Checklist
[ ] check-file-naming.js ok
[ ] validate-db-naming.js ok
[ ] Todos arquivos seguem padrão
[ ] Colunas do banco seguem snake_case