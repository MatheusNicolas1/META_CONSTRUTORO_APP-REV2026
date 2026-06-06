# P1.1 - Smoke test de producao

Data/hora: 2026-05-20 17:15 -03:00

## Escopo executado

- Dominio publico validado em producao.
- Formulario publico de contato validado no navegador apos correcao de CORS.
- Cadastro/login/perfil validados com usuario QA em producao via cliente Supabase autenticado.
- Fluxos internos validados por chamadas autenticadas ao Supabase remoto, porque a automacao visual do navegador interno nao conseguiu digitar em campos por ausencia do clipboard virtual.

## Evidencias

### Rotas publicas

Resultado HTTP: paginas publicas retornaram `200` e shell HTML com `root`:

- `/home`
- `/preco`
- `/sobre`
- `/contato`
- `/login`
- `/criar-conta`
- `/recuperar-senha`
- `/politica-privacidade`
- `/termos-de-servico`
- `/lgpd`

### Contato publico

Problema inicial encontrado:

- Browser em `https://www.metaconstrutor.app.br/contato` falhava com `TypeError: Failed to fetch`.
- Causa: Edge Function `send-contact` respondia CORS para `https://metaconstrutor.com.br`, mas a producao esta em `https://www.metaconstrutor.app.br`.

Correcao aplicada/deployada:

- `supabase/functions/_shared/cors.ts`
- `supabase/functions/send-contact/index.ts`
- `supabase/functions/send-feedback/index.ts`

Comando de deploy executado:

```powershell
npx supabase functions deploy send-contact send-feedback --use-api
```

Validacao direta:

```json
{
  "OptionsStatus": 200,
  "OptionsAllowOrigin": "https://www.metaconstrutor.app.br",
  "PostStatus": 200,
  "PostAllowOrigin": "https://www.metaconstrutor.app.br",
  "message_id": "2b1211be-59b1-47e5-b04d-e5bf501c1f57"
}
```

Validacao no navegador:

- Pagina exibiu `Mensagem Enviada com Sucesso!`
- Texto de sucesso: `Recebemos sua mensagem e registramos sua solicitacao no atendimento.`

### Auth e dados autenticados

Usuario QA usado:

- `qa.prd.p1.1.1779307585003@example.com`
- `user_id`: `397e6fed-1587-4eb0-9fb1-12ab4cfd74ff`
- `org_id`: `bd596524-4d53-49b1-9bc7-17efa2ee295d`
- role: `Administrador`

Cadastro/login/perfil:

```json
{
  "guard": { "allowed": true },
  "signup": { "user": true, "session": true, "error": null },
  "signin": { "user": true, "session": true, "error": null },
  "profile": { "found": true, "error": null }
}
```

Fluxos autenticados validados antes do bloqueio:

- Criar obra: OK
- Editar obra: OK
- Criar fornecedor: OK
- Criar equipamento: OK
- Atualizar equipamento: OK usando `status='Parado'`
- Criar despesa: OK usando `cost_category='Material'`
- Criar checklist: OK usando `categoria='Outros'`
- Aprovar checklist via Edge Function `approve-checklist`: OK
- Upload de documento: OK usando `application/pdf`
- Listar documento: OK
- Excluir documento: OK
- Remover arquivo do Storage: OK

## Bloqueio No-Go

Ao tentar criar RDO com o payload equivalente ao codigo atual do app, o remoto rejeitou o status:

```text
Error: rdo_approve_create: new row for relation "rdos" violates check constraint "rdos_status_check"
```

Payload relevante testado:

```json
{
  "status": "DRAFT",
  "obra_id": "2bb2da5d-2f7e-446e-aff4-c695d1884706",
  "org_id": "bd596524-4d53-49b1-9bc7-17efa2ee295d",
  "criado_por_id": "397e6fed-1587-4eb0-9fb1-12ab4cfd74ff"
}
```

Evidencia no codigo atual:

- `src/hooks/useRDOs.ts` cria RDO com `status: 'DRAFT'`.
- O schema remoto ainda aplica `rdos_status_check` com valores legados em portugues, rejeitando `DRAFT`.

## Decisao

P1.1 deve parar aqui. Este e um No-Go automatico porque o fluxo critico de RDO nao cria em producao.

Proxima acao recomendada:

1. Reconciliar o schema remoto de `rdos.status` com o estado esperado pelo codigo (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`) ou ajustar o codigo para usar os estados legados do remoto.
2. Reexecutar P1.1 a partir de `Criar RDO`.
3. So depois validar envio, aprovacao, rejeicao e PDF de RDO.
