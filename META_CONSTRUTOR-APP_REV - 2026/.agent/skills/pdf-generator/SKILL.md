---
name: pdf-generator
description: Auxilia na criação e validação de PDFs de RDO e relatórios, garantindo que os dados necessários existam e o layout seja gerado corretamente.
---

# PDF Generator Skill

## Quando usar
- Antes de gerar PDFs de RDO
- Para validar se os dados necessários existem
- Ao testar novos layouts de relatório
- Para diagnosticar problemas na geração de PDF

## O que esta skill verifica

1. **Dados do RDO**: Se todos os campos obrigatórios estão preenchidos
2. **Imagens**: Se as imagens podem ser convertidas para base64
3. **Layout**: Se o PDF gerado segue o padrão A4 esperado
4. **Fallbacks**: Se existem dados fictícios sendo usados no PDF

## Passo a Passo

### PASSO 1: Validar dados do RDO antes de gerar PDF

```bash
node .agent/skills/pdf-generator/scripts/validate-pdf-data.js