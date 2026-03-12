---
name: security-monitor
description: Monitora e detecta mutações diretas no banco de dados feitas pelo frontend, um risco de segurança crítico. Use para auditoria contínua e planejamento de migração para Edge Functions.
---

# Security Monitor Skill

## Quando usar
- Para identificar hooks que fazem insert/update/delete direto no Supabase
- Antes de migrar para Edge Functions
- Em auditorias de segurança periódicas
- Para gerar relatórios de risco arquitetural

## O Problema

**Mutações Diretas no Frontend** são um risco de segurança grave:

```javascript
// ❌ PERIGOSO - Mutação direta do frontend
const { data } = await supabase
  .from('obras')
  .insert({ nome: 'Nova Obra' });

// ✅ SEGURO - Via Edge Function
const { data } = await fetch('/api/obras', {
  method: 'POST',
  body: JSON.stringify({ nome: 'Nova Obra' })
});