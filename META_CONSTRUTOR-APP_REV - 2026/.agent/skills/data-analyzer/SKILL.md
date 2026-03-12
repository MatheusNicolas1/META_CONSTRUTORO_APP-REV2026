---
name: data-analyzer
description: Analisa dados do banco para identificar registros órfãos, problemas em enums e inconsistências de integridade referencial. Use para diagnosticar problemas no banco de dados.
---

# Data Analyzer Skill

## Quando usar
- Ao suspeitar de dados inconsistentes
- Antes de migrações importantes
- Para limpeza de dados órfãos
- Ao diagnosticar erros de foreign key

## O que esta skill verifica

1. **Registros órfãos**: Entidades que referenciam IDs que não existem mais
2. **Enums incorretos**: Valores que não correspondem aos enums definidos
3. **Saúde geral do banco**: Estatísticas e métricas de integridade

## Passo a Passo

### PASSO 1: Verificar registros órfãos

```bash
node .agent/skills/data-analyzer/scripts/check-orphan-records.js