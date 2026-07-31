# PRD — Personalização de Cores nos Relatórios PDF

## Visão Geral
Permitir que o usuário escolha a cor principal dos relatórios PDF emitidos pelo sistema, usando o mesmo seletor de cor primária já existente em `Configurações > Aparência > Cor Principal`. Atualmente os relatórios usam `#0066cc` (azul) hardcoded nos templates HTML. A cor deve vir da configuração `primary_color` do usuário (tabela `user_settings`).

## Problema
- Relatórios RDO e relatórios genéricos usam cor azul fixa `#0066cc` independente da cor principal escolhida pelo usuário
- O seletor de cor primária já existe (laranja, azul, verde, vermelho) mas só afeta o frontend, não os PDFs
- Cabeçalho e rodapé não respeitam a cor do tema escolhido

## Funcionalidades

### F1: Edge Function busca cor do usuário autenticado
- A Edge Function `generate-rdo-pdf` deve buscar `primary_color` da tabela `user_settings` para o `user_id` extraído do JWT
- Mapear o nome da cor (`orange`, `blue`, `green`, `red`) para o valor HSL correspondente ao design system
- Injetar a cor no template HTML via CSS custom property ou substituição de variável

### F2: Templates PDF usam cor dinâmica
- `report-template.ts` (genérico): substituir `#0066cc` por `{{primary_color}}` ou variável CSS
- `template.ts` (RDO específico): substituir `#0066cc` por variável
- O cabeçalho, títulos de seção, linhas decorativas, bordas de cards e links devem usar a cor dinâmica
- Fallback seguro: se `primary_color` não existir, usar laranja (`#EA580C`) como padrão

### F3: Hook frontend envia preferência (melhoria)
- Opcional: o hook `useReportPdfDownload` pode buscar `user_settings.primary_color` e enviar no payload para evitar latência extra na edge function
- Prioridade: se ambos forem enviados, o valor do payload tem precedência sobre a busca interna

### F4: Rodapé e cabeçalho responsivos nos PDFs
- O HTML gerado deve usar `@media print` e unidades responsivas (`%`, `max-width`, etc.)
- Cabeçalho do RDO com largura adaptável (100% com padding fluido)
- Rodapé com numeração de páginas usando `@page` + `position: running()`

### F5: Seletor visual de cor na aba Aparência
- Melhorar o seletor de cor primária na aba "Aparência" (Configurações) para mostrar um preview visual (bolinhas coloridas) com preview da cor no relatório

## Paleta de Cores (mapeamento HSL)

| Nome    | HSL                | Hex     | Descrição           |
|---------|--------------------|---------|----------------------|
| orange  | `14 80% 42%`       | #C2410C | Laranja (padrão)     |
| blue    | `217 91% 60%`      | #3B82F6 | Azul                 |
| green   | `142 71% 45%`      | #16A34A | Verde                |
| red     | `0 72% 51%`        | #DC2626 | Vermelho             |

## Diagrama de Fluxo

```
Usuário → Configurações → Aparência → Seleciona Cor
                              ↓
                    Salva em user_settings.primary_color
                              ↓
              Ao gerar PDF → Hook busca user_settings
                              ↓
                    Envia primary_color no payload
                              ↓
              Edge Function → Aplica cor no HTML template
                              ↓
                   Gotenberg → Gera PDF com tema
```

## Arquivos a Modificar

### Backend (Edge Function)
1. `supabase/functions/generate-rdo-pdf/index.ts`
   - Buscar `user_settings.primary_color` dentro do handler (para RDO e genérico)
   - Criar função `getPrimaryColor(userId) -> string (HSL/CSS)`
   - Injetar cor no template HTML antes de enviar ao Gotenberg
2. `supabase/functions/generate-rdo-pdf/template.ts`
   - Substituir `#0066cc` por `{{primary_color}}` no CSS inline
3. `supabase/functions/generate-rdo-pdf/report-template.ts`
   - Substituir `#0066cc` por variável de cor

### Frontend
4. `src/hooks/useReportPdfDownload.ts`
   - Opcional: buscar `primary_color` e enviar no body
   - Adicionar campo `themeColor` ao `ReportPdfPayload`/body
5. `src/pages/Configuracoes.tsx`
   - Melhorar seletor de cor: adicionar preview visual (círculos coloridos) e indicador visual

## Testes
- Gerar RDO com cor "orange" → PDF deve ter laranja no cabeçalho e títulos
- Gerar RDO com cor "blue" → PDF deve ter azul
- Gerar relatório genérico com cor "green" → PDF deve ter verde
- Gerar sem configuração → fallback orange `#EA580C`
- Verificar responsividade do cabeçalho/rodapé em diferentes tamanhos de página (A4, Letter)
- Verificar que cores não vazam para conteúdo secundário (tabelas, badges de status)
