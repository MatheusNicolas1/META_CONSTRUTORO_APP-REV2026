---
name: migration-manager
description: Gerencia e valida migrations do banco de dados, verificando ordem cronológica, idempotência e integridade do schema. Use antes e depois de aplicar migrations.
---

# Migration Manager Skill

## Quando usar
- Antes de aplicar novas migrations
- Após aplicar migrations para validar
- Ao diagnosticar problemas de schema
- Antes de deploys em produção

## O que esta skill verifica

1. **Ordem cronológica**: Migrations estão em ordem correta de data
2. **Idempotência**: Migrations podem ser aplicadas múltiplas vezes sem erro
3. **Schema atual**: Compara schema real com o esperado
4. **Integridade**: Verifica se todas as tabelas e colunas necessárias existem

## Passo a Passo

### PASSO 1: Verificar migrations

```bash
node .agent/skills/migration-manager/scripts/test-migrations.js