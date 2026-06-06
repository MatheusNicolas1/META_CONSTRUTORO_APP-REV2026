# PRD_USUARIO - Ciclo 2 - Signup duplicado

Data: 2026-06-02  
Ambiente: local `http://127.0.0.1:5184`  
Escopo: P0.1 - criacao de conta com e-mail duplicado em PC, tablet e mobile.

## Objetivo

Fechar a pendencia de cadastro com e-mail ja existente sem revelar se a conta existe e sem criar registros duplicados em `profiles`.

## Alteracoes validadas

- `useSignUp` passou a retornar a mensagem generica de signup quando o cadastro nao gera perfil acessivel apos as tentativas de lookup.
- Testes unitarios cobrem erro direto do Supabase (`User already registered`) e caso obfuscado em que `signUp` retorna usuario sem perfil acessivel.
- Smoke Playwright dedicado cria um usuario existente via service role, tenta cadastrar o mesmo e-mail pela UI, valida erro generico, confirma ausencia de redirecionamento para `/app` e verifica que `profiles` manteve apenas o registro original.
- As paginas `MFA`, `RecuperarSenha` e `RedefinirSenha` foram restauradas de bytes nulos para permitir bundle/renderizacao das rotas publicas de auth.

## Execucoes automatizadas

### Unitario

Comando:

```bash
npm.cmd test -- src/hooks/__tests__/useSignUp.test.tsx
```

Resultado:

- 1 arquivo de teste passou.
- 3 testes passaram.

### Smoke PC

Comando:

```bash
BASE_URL=http://127.0.0.1:5184 DEVICE_NAME=PC VIEWPORT_WIDTH=1440 VIEWPORT_HEIGHT=900 node scripts/prd-usuario-ciclo2-signup-duplicado-smoke.mjs
```

Run ID: `1780455718732-a481f360`

Checks:

- Usuario duplicado seedado em `auth.users` e `profiles`.
- Cadastro duplicado exibiu erro generico e nao autenticou.
- Backend manteve apenas o perfil original para o e-mail duplicado.
- Cleanup removeu usuario/perfil/settings/roles/memberships.

Observacao: console registrou `422` do Supabase Auth, esperado para tentativa duplicada e tratado pela UI.

### Smoke Tablet

Comando:

```bash
BASE_URL=http://127.0.0.1:5184 DEVICE_NAME=Tablet VIEWPORT_WIDTH=834 VIEWPORT_HEIGHT=1194 node scripts/prd-usuario-ciclo2-signup-duplicado-smoke.mjs
```

Run ID: `1780455737748-fb52f1e1`

Checks:

- Usuario duplicado seedado em `auth.users` e `profiles`.
- Cadastro duplicado exibiu erro generico e nao autenticou.
- Backend manteve apenas o perfil original para o e-mail duplicado.
- Cleanup removeu usuario/perfil/settings/roles/memberships.

Observacao: console registrou `422` do Supabase Auth, esperado para tentativa duplicada e tratado pela UI.

### Smoke Mobile

Comando:

```bash
BASE_URL=http://127.0.0.1:5184 DEVICE_NAME=Mobile VIEWPORT_WIDTH=390 VIEWPORT_HEIGHT=844 node scripts/prd-usuario-ciclo2-signup-duplicado-smoke.mjs
```

Run ID: `1780455754530-4c39a68c`

Checks:

- Usuario duplicado seedado em `auth.users` e `profiles`.
- Cadastro duplicado exibiu erro generico e nao autenticou.
- Backend manteve apenas o perfil original para o e-mail duplicado.
- Cleanup removeu usuario/perfil/settings/roles/memberships.

Observacao: console registrou `422` do Supabase Auth, esperado para tentativa duplicada e tratado pela UI.

### Build

Comando:

```bash
npm.cmd run build
```

Resultado:

- `tsc -b` passou.
- `vite build` passou.
- `postbuild` gerou sitemap e prerenderizou 18 rotas publicas.

Avisos conhecidos:

- CSS `color-adjust` deprecado, substituir por `print-color-adjust` em ciclo proprio.
- Aviso de chunking por import dinamico/estatico do cliente Supabase.

## Limites

- Envio real de e-mail e integracoes externas continuam fora do gate obrigatorio deste PRD.
- MFA real de login e troca de senha com senha atual + nova senha continuam como decisao/implementacao de produto, pois a UI atual trabalha com reset por e-mail e tela MFA honesta/indisponivel.
