---
name: testing-strategy
description: Executa testes manuais e automatizados para validar fluxos críticos do aplicativo, incluindo autenticação, CRUD de entidades e isolamento multi-tenant.
---

# Testing Strategy Skill

## Quando usar
- Antes de deploys em produção
- Após alterações significativas no código
- Para validar correções de bugs
- Como parte do checklist de release

## O que esta skill verifica

1. **Fluxo de Autenticação**: Login, logout, registro e redirecionamentos
2. **CRUD de Entidades**: Criar, ler, atualizar e deletar obras, RDOs, etc
3. **Isolamento Multi-tenant**: Verificar se dados de uma org não vazam para outra
4. **Fluxos Críticos**: Criação de RDO com atividades, equipamentos e anexos

## Passo a Passo

### PASSO 1: Testar fluxo de autenticação

```bash
node .agent/skills/testing-strategy/scripts/test-auth-flow.js