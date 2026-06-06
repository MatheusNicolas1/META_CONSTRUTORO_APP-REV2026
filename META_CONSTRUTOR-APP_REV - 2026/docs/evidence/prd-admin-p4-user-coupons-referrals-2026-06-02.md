# PRD_ADMIN - P4 detalhe de usuario: cupons e referrals

Data: 2026-06-02

## Escopo executado

- Atualizado `src/components/admin/AdminUsers.tsx`.
- O detalhe do usuario agora busca:
  - `profiles.referral_code` e `profiles.referral_bonus_days`;
  - indicacoes geradas por `referrals.referrer_id = user_id`;
  - cadastros por indicacao por `referrals.new_user_id = user_id`;
  - eventos recentes de cupom/campanha filtrados em `analytics_events` com `user_id` do usuario selecionado.
- A UI ganhou os blocos `Indicacoes` e `Cupons e campanhas` no modal de detalhe.

## Decisao de contrato

`coupons` nao possui relacao direta por `user_id` no schema atual. Por isso, o painel nao atribui um cupom a um usuario apenas pelo codigo da tabela `coupons`; ele exibe somente eventos de marketing/cupom que ja estejam vinculados em `analytics_events.user_id`.

## Validacao

- `npx.cmd eslint src/components/admin/AdminUsers.tsx` passou.
- `npx.cmd tsc --noEmit --pretty false` passou.
- `npm.cmd run build` foi reexecutado e ficou bloqueado por erro fora do escopo admin: `src/components/NovaObraForm.tsx:319` envia `onFilesChange` para `DocumentosObra`, prop inexistente no contrato atual.

## Status PRD

O item de detalhe do usuario avancou para incluir cupons/referrals com relacao confiavel por `user_id`. Permanece aberto apenas o subitem de ultimos logins dedicados, pois nao ha tabela/contrato dedicado de login no schema validado nesta rodada.
