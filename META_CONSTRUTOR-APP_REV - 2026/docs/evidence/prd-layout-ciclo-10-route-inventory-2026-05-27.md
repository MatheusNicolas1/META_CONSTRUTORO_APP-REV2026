# Evidencia PRD_LAYOUT - Ciclo 10 - Inventario amplo de rotas

Data: 2026-05-27  
Status: concluido.

## Escopo executado

- Inventario de rotas publicas, autenticadas estaticas e redirecionamentos legados.
- Viewports cobertos:
  - `320x720`
  - `390x844`
  - `768x1024`
  - `1440x900`
- Envio real de e-mail mantido fora da execucao conforme decisao do usuario.

## Arquivo criado

```text
scripts/prd-layout-route-inventory-smoke.spec.ts
```

O smoke cria usuario temporario `Presidente`, organizacao e credito QA, autentica pela UI e limpa os dados ao final. As rotas sao validadas em lote por viewport para evitar falsos negativos causados por muitos logins sequenciais.

## Cobertura

- 26 rotas publicas por viewport:
  - `/`, `/home`, `/sobre`, `/contato`, `/preco`
  - `/checkout?plan=basic`, `/checkout/success`, `/checkout/cancel`
  - `/login`, `/criar-conta`, `/recuperar-senha`, `/redefinir-senha`, `/mfa`, `/renovar-sessao`
  - `/atualizacoes`, `/carreiras`, `/blog`, `/central-ajuda`, `/documentacao`, `/status`, `/api`
  - `/legal/privacidade`, `/legal/termos`, `/legal/cookies`, `/legal/lgpd`
  - `/perfil/:slug` em estado renderizado
- 25 rotas autenticadas estaticas por viewport:
  - `/app/dashboard`, `/app/obras`, `/app/rdo`, `/app/rdo/novo`
  - `/app/atividades`, `/app/checklist`, `/app/equipes`, `/app/equipes/novo`
  - `/app/colaboradores`, `/app/colaboradores/novo`, `/app/equipamentos`, `/app/mais`
  - `/app/documentos`, `/app/fornecedores`, `/app/despesas`, `/app/relatorios`
  - `/app/integracoes`, `/app/configuracoes`, `/app/perfil`, `/app/notificacoes`
  - `/app/feedback`, `/app/faq`, `/app/seguranca`, `/app/admin/dashboard`, `/app/configurar-perfil`
- 21 redirecionamentos legados por viewport:
  - `/dashboard`, `/obras`, `/rdo`, `/atividades`, `/checklist`, `/equipes`, `/colaboradores`, `/equipamentos`
  - `/mais`, `/documentos`, `/fornecedores`, `/despesas`, `/relatorios`, `/integracoes`, `/configuracoes`
  - `/perfil`, `/notificacoes`, `/feedback`, `/faq`, `/seguranca`, `/admin/dashboard`

## Comandos executados

```powershell
npx playwright test scripts/prd-layout-route-inventory-smoke.spec.ts --reporter=list
```

Resultado:

```text
12 passed (1.3m)
```

Regressao consolidada:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts scripts/prd-layout-pwa-smoke.spec.ts scripts/prd-layout-route-inventory-smoke.spec.ts --reporter=list
```

Resultado:

```text
70 passed (1.8m)
```

## Criterios verificados

- Cada rota renderiza texto util.
- `document.documentElement.scrollWidth` e `document.body.scrollWidth` ficam dentro da largura da viewport.
- Rotas autenticadas permanecem na area autenticada e nao caem na tela de login.
- Rotas legadas redirecionam para `/app`.

## Observacoes

- O teste inicial por rota individual gerava muitos logins UI em sequencia e produziu falsos negativos por timeout de sessao. A versao final valida rotas em lote por viewport.
- O perfil publico QA foi validado como rota renderizada sem overflow. A exposicao anonima de dados reais depende da politica atual de `profiles`, portanto nao foi usada como criterio de layout.
