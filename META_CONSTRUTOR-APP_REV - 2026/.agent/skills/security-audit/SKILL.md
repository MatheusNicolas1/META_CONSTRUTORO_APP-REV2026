---
name: security-audit
description: Realiza auditoria completa de segurança no banco, edge functions e storage. Verifica RLS, políticas de acesso, rate limiting e exposição de dados.
---

# Security Audit Skill

## Quando usar
- Antes de deploys em produção
- Após adicionar novas tabelas ou policies
- Para diagnosticar falhas de segurança
- Em auditorias periódicas de segurança

## O que esta skill verifica

1. **RLS (Row Level Security)**: Se está habilitado em todas as tabelas e se as policies estão corretas
2. **Edge Functions**: Se têm validação de input, rate limiting e autenticação
3. **Storage**: Se buckets têm policies corretas e não estão públicos
4. **Exposição de dados**: Se há vazamento de informações entre organizações

## Passo a Passo

### PASSO 1: Auditar RLS

```bash
node .agent/skills/security-audit/scripts/audit-rls.js