---
name: release-readiness
description: Executa checklist completo de preparação para release/deploy do MVP. Verifica builds, variáveis de ambiente, testes e documentação antes de lançar.
---

# Release Readiness Skill

## Quando usar
- Antes de fazer deploy em produção
- Antes de liberar nova versão para testes
- Para garantir que tudo está pronto para lançamento
- Como checklist final de qualidade

## O que esta skill verifica

1. **Variáveis de ambiente**: Todas as chaves necessárias estão configuradas
2. **Build de produção**: O projeto compila sem erros
3. **Testes automatizados**: Scripts de validação passaram
4. **Documentação**: README e guias atualizados
5. **Banco de dados**: Migrations aplicadas e schema válido
6. **Segurança**: RLS e policies verificadas

## Passo a Passo

### PASSO 1: Verificar variáveis de ambiente

```bash
node .agent/skills/release-readiness/scripts/verify-env-vars.js