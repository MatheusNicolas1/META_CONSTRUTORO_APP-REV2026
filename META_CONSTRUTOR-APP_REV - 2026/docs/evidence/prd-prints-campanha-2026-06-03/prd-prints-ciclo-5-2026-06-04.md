# PRD_PRINTS - Ciclo 5 - Telas de apoio publicitario

Data: 2026-06-04  
Ambiente: app local `http://127.0.0.1:5173` com Supabase remoto configurado no `.env`  
Conta de captura: `campanha+prdprints10@metaconstrutor.test`  
Pasta segura: `docs/evidence/prd-prints-campanha-2026-06-03/`

## Objetivo

Capturar as telas de apoio que ainda estavam fora do lote publicitario:

- Perfil.
- Configuracoes.
- Notificacoes.
- FAQ.
- Feedback.

## Execucao

O script `scripts/prd-prints-screenshots.mjs` foi ajustado para incluir `supportRoutes` com as rotas:

- `/app/perfil`
- `/app/configuracoes`
- `/app/notificacoes`
- `/app/faq`
- `/app/feedback`

O lote completo foi recapturado para preservar a regra de que o dashboard deve ser o ultimo print.

## Resultado

- `manifest.json`: `captured`.
- Screenshots no manifesto: 28.
- Eventos criticos de console: 0.
- Eventos transitorios: 1 evento Auth `_useSession` do Supabase, sem impacto visual no lote.
- Ultimo print: `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

## Novos prints

- `prd-prints-2026-06-04-17-perfil-conta-desktop.png`: perfil com dados demonstrativos e e-mail `.test`.
- `prd-prints-2026-06-04-18-configuracoes-desktop.png`: configuracoes da empresa demonstrativa.
- `prd-prints-2026-06-04-19-notificacoes-desktop.png`: notificacoes em estado vazio honesto.
- `prd-prints-2026-06-04-20-faq-desktop.png`: central de ajuda autenticada.
- `prd-prints-2026-06-04-21-feedback-desktop.png`: formulario de feedback sem envio real.
- `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`: dashboard final consolidado.

## Validacao visual

As cinco novas telas foram inspecionadas visualmente. Nenhuma exibiu senha, token, devtools, toast de erro, dado real de cliente ou chamada externa executada. A tela de notificacoes foi mantida como estado vazio honesto, sem criar mensagens artificiais apenas para campanha.

## Validacao tecnica

Comando executado:

```powershell
$env:PRD_PRINTS_PASSWORD = <senha temporaria em memoria>
$env:PRD_PRINTS_CAPTURE_DATE = '2026-06-04'
node scripts/prd-prints-screenshots.mjs
Remove-Item Env:\PRD_PRINTS_PASSWORD
Remove-Item Env:\PRD_PRINTS_CAPTURE_DATE
```

Saida principal:

```json
{
  "status": "captured",
  "screenshots": 28,
  "final_screenshot": "prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png",
  "console_events": 0
}
```

Tambem foi executado `node --check scripts/prd-prints-screenshots.mjs`, sem erro de sintaxe.

`npm run lint`, `npm run test` e `npm run build` nao foram reexecutados neste ciclo porque a mudanca foi restrita ao script operacional de captura e aos documentos do PRD. Os gates completos continuam registrados no Ciclo 2.
