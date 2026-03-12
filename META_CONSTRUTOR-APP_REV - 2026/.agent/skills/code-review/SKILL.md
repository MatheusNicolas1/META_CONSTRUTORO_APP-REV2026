---
name: code-review
description: Revisa código TypeScript/React para identificar problemas de tipo, fallbacks hardcoded, tratamento de erros e boas práticas. Use ao revisar PRs ou antes de commits.
---

# Code Review Skill

Esta skill ajuda a revisar código fonte de forma sistemática, identificando problemas comuns que podem causar bugs ou débito técnico.

## Quando usar esta skill

- Ao revisar Pull Requests
- Antes de fazer commit de código novo
- Quando encontrar bugs inesperados em produção
- Durante sessões de pair programming
- Para manter qualidade consistente do código

## O que esta skill verifica

1. **Tipagem TypeScript**: Uso correto de tipos, evitar `any`, interfaces bem definidas
2. **Fallbacks hardcoded**: Identificar dados fictícios que podem aparecer em produção
3. **Tratamento de erros**: Try/catch, toast de feedback, fallbacks seguros
4. **Queries Supabase**: Filtros por org_id, RLS compatível, selects eficientes
5. **Imports e dependências**: Organização e evitar imports circulares

## Passo a passo da revisão

### PASSO 1: Executar verificação de tipos

Primeiro, execute o script de verificação de tipos para identificar problemas de TypeScript:

```bash
node .agent/skills/code-review/scripts/verify-types.js