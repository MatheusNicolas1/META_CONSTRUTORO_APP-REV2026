---
name: ui-responsive
description: Verifica e testa a responsividade da aplicação em diferentes tamanhos de tela, garantindo que a interface funcione corretamente em mobile, tablet e desktop.
---

# UI Responsive Skill

## Quando usar
- Antes de deploys em produção
- Após alterações significativas no layout
- Para validar correções de CSS
- Como parte do checklist de release

## O que esta skill verifica

1. **Breakpoints**: Comportamento em 360px (mobile), 768px (tablet) e 1366px (desktop)
2. **Overflow**: Se há scroll horizontal indesejado
3. **Menu mobile**: Se o menu hambúrguer funciona
4. **Tabelas responsivas**: Se tabelas têm scroll horizontal em telas pequenas
5. **Formulários**: Se inputs não quebram o layout

## Breakpoints do Projeto

| Dispositivo | Largura | Comportamento |
|-------------|---------|---------------|
| Mobile pequeno | 360px | Menu hambúrguer, empilhamento vertical |
| Mobile grande | 480px | Ajustes finos |
| Tablet | 768px | Layout 2 colunas |
| Desktop | 1024px | Layout completo |
| Desktop HD | 1366px+ | Layout expandido |

## Passo a Passo

### PASSO 1: Testar responsividade manualmente

```bash
node .agent/skills/ui-responsive/scripts/test-responsive.js