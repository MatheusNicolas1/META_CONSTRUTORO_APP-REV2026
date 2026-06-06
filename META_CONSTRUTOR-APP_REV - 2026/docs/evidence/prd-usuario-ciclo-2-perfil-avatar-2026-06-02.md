# PRD_USUARIO - Ciclo 2 perfil, avatar e acoes sensiveis

Data: 2026-06-02  
Executor: Codex  
Ambiente: local `http://127.0.0.1:5182`  
Script: `scripts/prd-usuario-ciclo2-perfil-avatar-smoke.mjs`

## Escopo

Rotas e componentes cobertos:

- `/app/configurar-perfil`
- `/app/perfil`
- `/app/configuracoes`
- `src/pages/ConfigurarPerfil.tsx`
- `src/components/profile/PersonalDataCard.tsx`
- `src/components/profile/SecurityCard.tsx`
- `src/pages/Configuracoes.tsx` para alinhamento do upload de logo com politica de storage

## Ajustes aplicados

- `ConfigurarPerfil`: os updates de estado dos campos passaram a usar forma funcional para evitar perda de alteracoes sequenciais antes de salvar.
- `PersonalDataCard`: os updates de estado dos campos passaram a usar forma funcional.
- `PersonalDataCard`: o upload de avatar passou a usar `community_media/{user.id}/avatars/{timestamp}.ext`, respeitando a politica de storage por dono.
- `PersonalDataCard`: adicionado `data-testid="profile-avatar-input"` para smoke deterministico do upload.
- `Configuracoes`: o upload de logo passou a usar `community_media/{user.id}/logos/{timestamp}.ext`, respeitando a mesma politica de storage.
- `SecurityCard`: o conteudo estruturado dos dialogs de exclusao deixou de ser renderizado dentro de `AlertDialogDescription`, removendo aviso de DOM nesting.

## Cobertura automatizada

Foram criados usuarios temporarios admin e colaborador, uma organizacao de teste, creditos e perfis. Ao final de cada run, o script removeu objetos de storage, dados da organizacao, `user_roles`, `user_settings`, `profiles` e usuarios de `auth.users`.

Checks executados em todos os dispositivos:

- Login do admin autenticado.
- Usuario completa configuracao inicial em `/app/configurar-perfil`.
- Nome, telefone, cargo, empresa, biografia, perfil publico e ocultar assinatura persistem em `profiles`.
- Dados de configuracao inicial recarregam na UI apos reload.
- Dados pessoais em `/app/perfil` salvam nome, telefone, empresa e CPF/CNPJ em `profiles`.
- Avatar e enviado ao Supabase Storage, grava `profiles.avatar_url`, aparece na UI e continua visivel apos reload.
- Acao sensivel de exclusao exige dois dialogs, senha e texto `EXCLUIR`; a exclusao real foi cancelada antes da chamada destrutiva.
- Colaborador sem permissao e bloqueado em `/app/configuracoes` com mensagem de acesso negado.

## Execucoes

| Dispositivo | Viewport | Run ID | Resultado |
| --- | --- | --- | --- |
| PC | 1366x768 | `1780432864347` | Passou sem `consoleErrors` e sem `failedResponses` |
| Tablet | 768x1024 | `1780432891331` | Passou sem `consoleErrors` e sem `failedResponses` |
| Mobile | 390x844 | `1780432960242` | Passou sem `consoleErrors` e sem `failedResponses` |

Observacao: uma execucao mobile concorrente com tablet falhou antes do salvamento inicial, sem deixar dados persistidos; a mesma validacao mobile passou isolada logo em seguida. Para a matriz oficial deste ciclo, os smokes foram considerados em execucao serial por dispositivo.

## Evidencia de storage

Exemplos de objetos temporarios criados e removidos:

- `community_media/194addcb-52e9-4d65-8352-f95259378264/avatars/1780432874848.png`
- `community_media/401385fd-922b-4fdd-a438-4006dceb033a/avatars/1780432902558.png`
- `community_media/7f9eb28e-642a-4193-9640-e3c866283e17/avatars/1780432971991.png`

## Build

Comando:

```powershell
npm.cmd run build
```

Resultado: passou.

Avisos conhecidos preservados:

- `[vite:css] Replace color-adjust to print-color-adjust.`
- Aviso de chunking por import dinamico/estatico de `src/integrations/supabase/client.ts`.

## Fora do gate obrigatorio

- Nenhum e-mail real foi enviado.
- A exclusao real de conta nao foi executada; somente as confirmacoes e bloqueios de UI foram validados.
- A chamada destrutiva `delete-account` permanece fora desta evidencia por exigir confirmacao operacional especifica.
