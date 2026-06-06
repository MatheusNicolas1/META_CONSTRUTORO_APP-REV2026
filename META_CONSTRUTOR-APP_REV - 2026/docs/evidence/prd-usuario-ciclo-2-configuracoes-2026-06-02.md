# PRD_USUARIO - Ciclo 2 Configuracoes pessoais

Data: 2026-06-02  
Executor: Codex  
Ambiente: local `http://127.0.0.1:5180`  
Script: `scripts/prd-usuario-ciclo2-configuracoes-smoke.mjs`

## Escopo validado

- Usuario temporario com papel `Administrador`, organizacao propria e plano enterprise.
- Rota autenticada `/app/configuracoes`.
- Persistencia em `profiles`: empresa, CNPJ/CPF, telefone, e-mail e endereco da empresa.
- Persistencia em `user_settings`: tema `dark`, idioma `en-US`, cor primaria `blue`, fonte `large`, notificacoes por e-mail/push/prazo/relatorios desativadas.
- Reload da pagina apos salvar.
- Novo login apos limpar sessao/local storage de tema para validar carregamento do tema pelo backend.
- Matriz responsiva PC, tablet e mobile.

## Correcoes aplicadas

- `src/pages/Configuracoes.tsx`: handlers de switches/selects passaram a usar atualizacao funcional de estado para nao perder mudancas sequenciais antes do submit.
- `src/pages/Configuracoes.tsx`: o select de tema passou a usar `settings.theme` e o submit preserva o tema escolhido, incluindo um `pendingThemeRef` para evitar sobrescrita por carregamento assincrono.
- `src/pages/Configuracoes.tsx`: adicionados `data-testid` aos selects de aparencia para smoke deterministico.
- `scripts/prd-usuario-ciclo2-configuracoes-smoke.mjs`: criado smoke ponta a ponta com seed/cleanup via Supabase service role, validacao de backend, reload e novo login.

## Execucoes finais

| Dispositivo | Viewport | Run ID | Resultado |
| --- | --- | --- | --- |
| PC | 1366x768 | `1780413702940` | Passou |
| Tablet | 768x1024 | `1780413723471` | Passou |
| Mobile | 390x844 | `1780413671280` | Passou |

Checks finais em todos os dispositivos:

- Login admin autenticado.
- `/app/configuracoes` carregou.
- Preferencias de notificacao alteradas na UI.
- Tema escuro, idioma ingles, fonte grande e cor azul selecionados.
- Dados da empresa preenchidos.
- `profiles` e `user_settings` persistiram no backend.
- Reload manteve tema escuro e preferencias de notificacao.
- Tema escuro sobreviveu a novo login vindo do backend.
- Cleanup removeu `org_credits`, `subscriptions`, `org_members`, `orgs`, `user_roles`, `user_settings`, `profiles` e `auth.users`.

Observacao: `401` de `user_interactions` durante troca de sessao/logout-login foi tratado como ruido esperado de analytics anonimo, nao como falha critica do fluxo de configuracoes.

## Build

Comando:

```powershell
npm.cmd run build
```

Resultado: passou.

Avisos conhecidos mantidos:

- CSS: `color-adjust` depreciado, recomendado `print-color-adjust`.
- Vite: `src/integrations/supabase/client.ts` importado de forma dinamica e estatica, sem quebrar build.

## Pendencias remanescentes do P0.2

- Configuracao inicial de usuario novo em `/app/configurar-perfil`.
- Foto/avatar persistindo e refletindo em todos os locais esperados.
- Alteracao de senha e acoes sensiveis.
- Validacao negativa de dados da organizacao para papel nao autorizado.
