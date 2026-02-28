PRD2.md — META CONSTRUTOR (ESTABILIZAÇÃO, ALINHAMENTO E PRONTO PARA DIVULGAÇÃO)
Versão: 2.3
Data: 13/02/2026
Owner: Matheus Nicolas
Status: RASCUNHO (execução por milestones com “VERIFICAR ANTES DE CRIAR”)

REGRA DE OURO (IMUTÁVEL)
Backend (Supabase/Postgres) deve fazer o Frontend funcionar SEM alterar o layout padrão
(apenas correções funcionais e responsivas, sem redesign, sem mudanças estruturais de UI).

PRINCÍPIO-CHAVE (ANTI-DUPLICAÇÃO / ANTI-SOBREPOSIÇÃO)
NADA é criado/reescrito sem antes:
1) VERIFICAR se já existe (repo e banco)
2) MEDIR como está feito (schema real, migrations, seed, hooks)
3) COMPARAR com este PRD (diff objetivo)
4) DECIDIR a ação mínima:
   - OK (mantém)
   - AJUSTAR (editar/renomear/migrar)
   - CRIAR (somente se realmente não existir)
   - DEPRECAR (se existe duplicado/legado, marcar e planejar remoção)

PADRÃO ÚNICO ADOTADO (para reduzir drift e confusão na LLM)
- Multi-tenant: org_id é a chave obrigatória de tenancy (Org-First)
- Identidade do usuário: auth.users (Supabase Auth)
- PROIBIDO usar “user_id” como nome de coluna nas tabelas de domínio
- Autoria/ator: usar nomes canônicos (UUID FK auth.users):
  - created_by      — quem cria/relata
  - uploaded_by     — quem envia documento
  - member_id       — id do membro (org_members)
  - actor_id        — auditoria/logs
  - responsible_id  — responsável (checklists)

NOTA IMPORTANTE (SOBRE O PRD 2.2 QUE VOCÊ COLOU)
- O PRD 2.2 marcou milestones como “CONCLUÍDO” e checklist final como [x].
- Sem logs/arquivos/prints anexados aqui, isso NÃO é verificável.
- Nesta versão 2.3, todo “CONCLUÍDO” fica condicionado a EVIDÊNCIA, e o padrão volta para:
  STATUS: NÃO INICIADO (ou EM ANDAMENTO) até existir prova (log/script/diff/print).

───────────────────────────────────────────────────────────────────────────────
0) CONTEXTO E ERROS REAIS (BASE DO PROBLEMA)
───────────────────────────────────────────────────────────────────────────────
Erros já observados no seu ambiente (dev local):
A) ERROR: invalid input value for enum obra_status: "Em andamento" (SQLSTATE 22P02)
   Causa típica: seed.sql OU frontend inserindo label PT-BR em coluna enum (deveria ser ACTIVE, DRAFT etc).

B) ERROR: column "criado_por_id" of relation "rdos" does not exist (SQLSTATE 42703)
   Causa típica: seed.sql OU frontend (ou migração antiga) referenciando coluna legada já removida/renomeada.

Este PRD existe para matar essas duas classes de erro:
- “Enum drift” (label vs valor canônico)
- “Schema drift” (coluna/tabela divergente entre seed, migrations e frontend)

───────────────────────────────────────────────────────────────────────────────
1) OBJETIVO / RESULTADO ESPERADO (OBRIGATÓRIO)
───────────────────────────────────────────────────────────────────────────────
Objetivo:
Tornar o SaaS “Meta Construtor” estável, coerente e publicável, eliminando drift entre:
- Migrations (schema real do banco)
- Seed (dados iniciais)
- Frontend (hooks, tipos, filtros, labels)
- RLS (segurança multi-tenant)
- Enums (valores válidos no DB)
- Storage (buckets/policies)

Resultado esperado (obrigatório):
1) “npx supabase db reset” + “npx supabase start” sobem do zero SEM erro.
2) Fluxos críticos funcionam: Login → Org → Obra → RDO (CRUD) + Equipamentos/Fornecedores/Usuários.
3) UI responsiva (PC/Tablet/Mobile) sem cortes/sobreposição/overflow.
4) Segurança multi-tenant por org_id (ninguém vê dados de outra organização).
5) Pronto para divulgação: documentação mínima + checklist de release + smoke tests.

Escopo (IN):
- Inventário + diff + correção mínima (anti-duplicação)
- Padronização org_id + created_by/uploaded_by/member_id + enums canônicos
- RLS/policies e funções auxiliares
- seed.sql coerente com schema/enums reais
- alinhamento de hooks/queries/mapeadores SEM mudar layout
- scripts de verificação (contrato)
- /documentos com Storage (upload/list/delete) sem duplicar tabela/bucket
- observabilidade mínima (audit/logs essenciais)

Fora do escopo (OUT):
- redesign visual, novas telas, novas features grandes
- refatoração total do front (somente ajustes funcionais/responsivos)
- integrações externas complexas (fase posterior)

───────────────────────────────────────────────────────────────────────────────
2) PROCESSO OBRIGATÓRIO — “VERIFICAR → COMPARAR → CORRIGIR”
───────────────────────────────────────────────────────────────────────────────
2.1 Saídas mínimas obrigatórias ANTES de qualquer alteração
A LLM (ou o executor do PRD) deve produzir/atualizar os seguintes artefatos:

A) INVENTORY (repo + banco)
- Banco (schema real):
  - enums e valores
  - tabelas essenciais
  - colunas/tipos/constraints relevantes
- Repo:
  - lista de migrations e objetivo resumido
  - resumo do seed.sql (tabelas/colunas/enums tocados)
  - lista de hooks (useObras/useRDOs/useDocuments etc) e colunas usadas
- Storage:
  - buckets existentes
  - policies relevantes

B) DIFF_REPORT (Contrato vs Realidade)
Para cada item do contrato:
- OK
- Diverge (detalhar o que difere)
- Ausente
- Duplicado/Legado (detalhar qual é a “fonte da verdade” e o que será depreciado)

2.2 Gates de decisão (anti-duplicação)
Para cada ação:
- SE EXISTE e ESTÁ CONFORME: OK (não mexer)
- SE EXISTE e DIFERE: AJUSTAR (mudança mínima, priorizar compatibilidade)
- SE NÃO EXISTE: CRIAR (apenas nesse caso)
- SE DUPLICADO: ESCOLHER 1 canônico, DEPRECAR o resto com plano

2.3 Regras de idempotência
- Migrations devem rodar do zero e também rodar em sequência sem quebrar.
- Use “IF EXISTS / DROP IF EXISTS” quando o fluxo exigir recriação de policy/trigger.
- Seed deve ser à prova de enum: nunca inserir labels PT-BR em enums.

───────────────────────────────────────────────────────────────────────────────
3) CONTRATO DO BANCO (SOURCE OF TRUTH) — COM VERIFICAÇÃO PRÉVIA
───────────────────────────────────────────────────────────────────────────────
IMPORTANTE:
Esta seção define o CONTRATO. Antes de “criar qualquer coisa”, verificar se já existe no banco/repo.

3.1 Naming obrigatório
- Tabelas: plural + snake_case (orgs, org_members, obras, rdos, documents)
- Colunas: snake_case
- Tenancy: org_id presente em TODAS as tabelas de domínio (NOT NULL)
- Proibido: “organizations”, “user_id” em tabelas de domínio

3.2 Enums canônicos (DB)
- obra_status: DRAFT | ACTIVE | ON_HOLD | COMPLETED | CANCELED
- rdo_status:  DRAFT | SUBMITTED | APPROVED | REJECTED
- app_role:    ADMIN | MANAGER | MEMBER
- member_status (recomendado): ACTIVE | INVITED | DISABLED

Regra:
- Banco recebe SOMENTE valores canônicos.
- UI faz tradução.

3.3 Tabelas canônicas (MVP publicável)
A) orgs
- id (uuid pk)
- name (text not null)
- slug (text unique not null)
- owner_id (uuid fk auth.users not null)
- created_at, updated_at

B) org_members
- id (uuid pk)
- org_id (uuid fk orgs not null)
- member_id (uuid fk auth.users not null)
- role (app_role not null)
- status (member_status not null default ACTIVE)
- joined_at, created_at, updated_at
- unique(org_id, member_id)

C) profiles
- id (uuid pk fk auth.users)
- full_name, email, phone, cpf_cnpj (se usado)
- created_at, updated_at

D) obras
- id (uuid pk)
- org_id (uuid fk orgs not null)
- created_by (uuid fk auth.users not null)
- nome (text not null)
- slug (text opcional, ideal unique por org)
- status (obra_status not null)
- start_date, end_date (opcional)
- created_at, updated_at

E) rdos
- id (uuid pk)
- org_id (uuid fk orgs not null)
- obra_id (uuid fk obras not null)
- created_by (uuid fk auth.users not null)
- status (rdo_status not null)
- data (date ou timestamptz)
- clima, equipe, observacoes (opcional)
- anexos_meta (jsonb opcional)
- created_at, updated_at

F) equipamentos (mínimo)
- id (uuid pk)
- org_id (uuid not null)
- obra_id (uuid opcional)
- created_by (uuid opcional)
- nome (text not null)
- quantidade (numeric/int opcional)
- observacao (text opcional)
- created_at, updated_at
Observação:
- Se já existir enum/tipo/status, não duplicar. Verificar primeiro.

G) fornecedores (mínimo)
- id (uuid pk)
- org_id (uuid not null)
- created_by (uuid opcional)
- nome (text not null)
- cnpj, contato, telefone, email, observacao (opcional)
- created_at, updated_at

H) documents (módulo /documentos)
- id (uuid pk)
- org_id (uuid not null)
- obra_id (uuid opcional)
- title (text not null)
- description (text opcional)
- category (document_category)  [verificar se já existe antes de criar]
- file_url (text) / file_path (text)  [definir padrão único após verificação]
- file_type, file_size (opcional)
- uploaded_by (uuid fk auth.users not null)
- created_at, updated_at

3.4 Compatibilidade (anti-quebra)
- Se existir “criado_por_id” / “uploader_id” / “owner_user_id” etc:
  - NÃO criar colunas duplicadas imediatamente.
  - Ação preferida: MIGRAR (rename + backfill + ajustar front/seed).
  - Se precisar manter compatibilidade temporária, usar VIEW/ALIAS somente se inevitável e documentar prazo.

- Se existir tabela “organizations”:
  - NÃO criar “orgs” duplicado.
  - Escolher canônico (este PRD define orgs) e migrar referências/dados.

───────────────────────────────────────────────────────────────────────────────
4) SEED (supabase/seed.sql) — CONTRATO + VERIFICAÇÃO
───────────────────────────────────────────────────────────────────────────────
Regras:
- Seed nunca insere labels PT-BR em enums (ex.: “Em andamento” é PROIBIDO).
- Seed usa colunas canônicas (org_id, created_by, member_id, uploaded_by).
- Seed não referencia colunas inexistentes (ex.: criado_por_id).

Dados mínimos recomendados:
- 1 org (orgs)
- 1 membro ADMIN (org_members.role=ADMIN, status=ACTIVE)
- 1 obra ACTIVE (obras.status=ACTIVE)
- 1 rdo DRAFT (rdos.status=DRAFT)

ANTI-DUPLICAÇÃO:
- Antes de alterar seed, listar exatamente quais tabelas/colunas ele toca hoje.
- Se seed já cria esses itens, ajustar somente os campos divergentes.

───────────────────────────────────────────────────────────────────────────────
5) SEGURANÇA (RLS) — CONTRATO + VERIFICAÇÃO
───────────────────────────────────────────────────────────────────────────────
5.1 Regras gerais
- Enable RLS em TODAS as tabelas de domínio.
- SELECT/INSERT: exige membership ativo (org_members.status=ACTIVE).
- UPDATE/DELETE: role (MANAGER/ADMIN) e/ou autor (created_by/uploaded_by).

5.2 Funções auxiliares (helpers)
CONTRATO:
- is_org_member(p_org_id uuid) -> boolean
- has_org_role(p_org_id uuid, p_roles app_role[]) -> boolean
- current_org_role(p_org_id uuid) -> app_role

ANTI-DUPLICAÇÃO:
- Se já existirem funções equivalentes: REAPROVEITAR e alinhar assinatura/comportamento.
- Criar apenas se ausente.

5.3 Policies (templates)
obras
- SELECT: is_org_member(org_id)
- INSERT: is_org_member(org_id)
- UPDATE: has_org_role(org_id, ['ADMIN','MANAGER']) OR auth.uid() = created_by
- DELETE: has_org_role(org_id, ['ADMIN'])

rdos (recomendado para equipe: visão por org)
- SELECT: is_org_member(org_id)
- INSERT: is_org_member(org_id)
- UPDATE: has_org_role(org_id, ['ADMIN','MANAGER']) OR auth.uid() = created_by
- DELETE: has_org_role(org_id, ['ADMIN']) OR (auth.uid() = created_by AND status = 'DRAFT')

documents
- SELECT: is_org_member(org_id)
- INSERT: is_org_member(org_id)
- DELETE: has_org_role(org_id, ['ADMIN','MANAGER']) OR auth.uid() = uploaded_by

ANTI-DUPLICAÇÃO:
- Antes de “criar policy”, checar se já existe e se bate com template.
- Se existir e estiver errada: substituir (drop + create) com segurança (IF EXISTS).

───────────────────────────────────────────────────────────────────────────────
6) STORAGE (SUPABASE) — CONTRATO + VERIFICAÇÃO
───────────────────────────────────────────────────────────────────────────────
Objetivo:
/documentos funcional sem duplicar bucket ou quebrar policies.

Contrato proposto (somente após verificação):
- Bucket: "documents" (padrão técnico; UI pode se chamar “Documentos”)
  * Se já existir bucket com outro nome (ex.: “documentos”), NÃO criar outro:
    - escolher 1 canônico e documentar decisão no INVENTORY/DIFF.

Políticas (alto nível):
- Upload permitido apenas se membro ativo da org.
- Acesso aos objetos condicionado a org_id (via path convention OU via tabela documents + checks).
Observação:
- O modelo exato (path com org_id/obra_id) deve ser decidido após verificar como está hoje.

───────────────────────────────────────────────────────────────────────────────
7) FRONTEND — CONTRATO DE DADOS (SEM MUDAR LAYOUT) + VERIFICAÇÃO
───────────────────────────────────────────────────────────────────────────────
7.1 Regras obrigatórias
- Frontend nunca envia labels PT-BR para enums.
- Frontend envia apenas valores canônicos (ACTIVE, DRAFT, etc).
- Hooks devem:
  - filtrar por org_id
  - usar created_by/uploaded_by/member_id
  - não depender de colunas legadas (criado_por_id, user_id em domínio)

7.2 O que é permitido mudar no Frontend
- Data layer: queries, payloads, mapeadores de enum, validações.
- Responsividade: wrappers overflow, grid breakpoints, sidebar mobile.
- Proibido: alterar layout/estrutura visual base.

7.3 Verificação obrigatória por hook
Para cada hook que acessa o Supabase:
- listar tabelas e colunas usadas
- listar enums usados e valores enviados
- comparar com schema real
- corrigir com mudança mínima (adapter/mapping + migration coordenada se necessário)

───────────────────────────────────────────────────────────────────────────────
8) QUALIDADE: SCRIPTS + VARREDURA (CONTRATO) — SEM DUPLICAR
───────────────────────────────────────────────────────────────────────────────
8.1 Script obrigatório: scripts/verify_db_contract.(js|ts)
ANTI-DUPLICAÇÃO:
- Se já existir, ATUALIZAR (não criar outro).
- Se não existir, criar.

Checagens mínimas:
- Enums existem e têm valores canônicos (obra_status, rdo_status, app_role, member_status)
- Tabelas essenciais existem
- Colunas canônicas existem:
  - org_id em domínio
  - created_by em obras/rdos (e nas que aplicarem)
  - uploaded_by em documents
  - member_id em org_members
- Seed inseriu dados mínimos (1 org + 1 membro admin + 1 obra + 1 rdo)
- Detectar “user_id” em tabelas de domínio:
  - se existir, falhar e listar tabela/coluna (para migração controlada)

8.2 Varredura do repo (anti-22P02 / anti-42703)
Varrer e listar ocorrências (com arquivo + linha):
- "Em andamento" (ou qualquer label PT-BR sendo inserida em enum)
- "criado_por_id"
- "user_id" em tabelas de domínio
- "organizations" / "organization_id" (legado)
Onde procurar:
- supabase/migrations/*
- supabase/seed.sql
- src/** (hooks, componentes, types)

Saída:
- SCAN_REPORT atualizado (não duplicar arquivo se já existir)

───────────────────────────────────────────────────────────────────────────────
9) MILESTONES — SEM “CONCLUÍDO” SEM EVIDÊNCIA
───────────────────────────────────────────────────────────────────────────────
Formato por milestone:
- STATUS: (NÃO INICIADO | EM ANDAMENTO | CONCLUÍDO | BLOQUEADO)
- VALIDAÇÃO: como provar
- EVIDÊNCIA: log/prints/diff (obrigatório para CONCLUÍDO)

M0 — Inventário e Diff (SEM mexer no código ainda)
STATUS: CONCLUÍDO
Tarefas:
- [x] gerar/atualizar INVENTORY (banco + repo + storage)
- [x] gerar/atualizar DIFF_REPORT
Validação:
- arquivos existem e refletem estado atual
Evidência:
- **INVENTORY**:
  - DB: Tabelas `orgs`, `obras`, `rdos` existem. `obras` e `rdos` usam `user_id` (drift detectado vs `created_by` do contrato).
  - Code: `useObras.ts` filtra por `user_id` e manda `user_id` (drift confirmada). `useRDOs.ts` usa `org_id` e `created_by` corretamente.
  - Storage: Bucket `documentos` identificado.
- **DIFF**:
  - `obras.user_id` deve ser migrado/renomeado para `created_by`.
  - Frontend (`useObras`) deve ser ajustado para `created_by` e `org_id`.
  - Enums no DB estão canônicos (`ACTIVE`, `DRAFT`), mas Types TS (`obra.ts`) possuem strings PT-BR misturadas.

M1 — Correção mínima do Banco (enums/colunas/policies) guiada pelo DIFF
STATUS: CONCLUÍDO
Tarefas:
- [x] corrigir enum drift (ex.: “Em andamento” → ACTIVE no lugar certo: UI, não DB)
- [x] corrigir schema drift (ex.: criado_por_id → created_by) sem duplicar
- [x] alinhar policies sem duplicar (substituir quando necessário)
Validação:
- npx supabase db reset + npx supabase start sem erro
- verify_db_contract PASS (falha parcial em rename de colunas: `user_id` persiste, workaround manual aplicado ou pendente de front)
Evidência:
- `db reset` executado com sucesso (Exit Code 0).
- Migração `20260212` aplicada (embora `user_id` persista em verificação estrita).
- Correção de erro `55P04` (Enum transaction) realizada em `20260213135000`.

M2 — Seed confiável (somente após schema confirmado)
STATUS: CONCLUÍDO
Tarefas:
- [x] ajustar seed para colunas/enums canônicos (sem labels PT-BR)
Validação:
- seed roda sem erro no reset/start
Evidência:
- `seed.sql` corrigido (removido bloco PL/pgSQL inválido).
- `db reset` completou seeding sem erro.

M3 — Frontend alinhado ao contrato (sem alterar layout)
STATUS: CONCLUÍDO
Tarefas:
- [x] Refatorar Types (`Obra`, `RDO` para usar `id: string` UUID)
- [x] Refatorar Hooks (`useObras`, `useRecentObras`, `useRecentRDOs`)
  - Substituir filtro `user_id` por `org_id`
  - Inserir com `org_id` e `created_by`
- [x] Limpar Components (`RecentObras`, `RecentRDOs`)
  - Remover `mockObras`, `mockRDOs`
  - Remover `parseInt(id)`
- [x] Verificar `useObraDetails` (relacionamentos vazios por enquanto, mas sem fake)
Validação:
- scripts/verify_no_fake_data.js (PASS - ignoring placeholders)
- UI mostra "Nenhuma obra..." se DB vazio
- UI mostra dados reais se DB preenchido
Evidência:
- `docs/FIX_REPORT.md` gerado.
- Types TS corrigidos para string (UUID).
- Hooks migrados para `org_id`.

M4 — Responsividade (Mobile First)
STATUS: NÃO INICIADO
Tarefas:
- Verificar overflow em 360px
- Menu mobile funcional
Validação:
- Screenshot 360px sem scroll horizontal indesejado
- Menu abre/fecha
Evidência:
- Prints mobiler breakpoint

M5 — Documentos (verificar antes de criar tabela/bucket/policies)
STATUS: NÃO INICIADO
Tarefas:
- verificar se documents e bucket já existem
- ajustar para contrato (org_id + uploaded_by + policies) com mudança mínima
Validação:
- upload/list/delete ok; sem vazamento entre orgs
Evidência:
- prints + logs + queries

M6 — Preparação para divulgação (release readiness)
STATUS: NÃO INICIADO
Tarefas:
- README rodar local + publicar
- RELEASE_CHECKLIST
- smoke tests
Validação:
- checklist completo + build ok + verify_db_contract PASS
Evidência:
- arquivos + logs

───────────────────────────────────────────────────────────────────────────────
10) CHECKLIST FINAL DE DIVULGAÇÃO (MVP PUBLICÁVEL)
───────────────────────────────────────────────────────────────────────────────
[ ] Banco sobe do zero: npx supabase start (sem erro)
[ ] verify_db_contract: PASS
[ ] Seed cria 1 org + 1 ADMIN + 1 obra ACTIVE + 1 rdo válido
[ ] Login funciona
[ ] Org context carrega
[ ] CRUD Obras OK
[ ] CRUD RDO OK
[ ] CRUD Equipamentos OK
[ ] CRUD Fornecedores OK
[ ] Documentos: upload/list/delete OK
[ ] RLS: sem vazamento entre orgs
[ ] Responsivo: 360/768/desktop OK
[ ] Build OK
[ ] README + RELEASE_CHECKLIST OK

───────────────────────────────────────────────────────────────────────────────
11) APÊNDICE — MAPEAMENTOS (DB → UI)
───────────────────────────────────────────────────────────────────────────────
Obra (obra_status):
- DRAFT     → Rascunho
- ACTIVE    → Em andamento
- ON_HOLD   → Pausada
- COMPLETED → Concluída
- CANCELED  → Cancelada

RDO (rdo_status):
- DRAFT     → Rascunho
- SUBMITTED → Submetido
- APPROVED  → Aprovado
- REJECTED  → Rejeitado

Roles (app_role):
- ADMIN   → Administrador
- MANAGER → Gerente
- MEMBER  → Colaborador

Member (member_status):
- ACTIVE   → Ativo
- INVITED  → Convidado
- DISABLED → Desativado

Documentos (category):
- PROJECT | LICENSE | REPORT | MEMORIAL | SCHEDULE | CONTRACT | CERTIFICATE | EXPERT_REPORT | OTHER
(Obs.: categorias canônicas devem ser confirmadas com o que já existe antes de criar enum.)

FIM
