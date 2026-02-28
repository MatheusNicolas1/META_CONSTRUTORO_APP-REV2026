PRD3.md — META CONSTRUTOR (INTEGRIDADE DE DADOS, ZERO “DADOS FICTÍCIOS” E CONSISTÊNCIA TOTAL)
Versão: 3.0
Data: 13/02/2026
Owner: Matheus Nicolas
Status: EM EXECUÇÃO (M3 iniciado em 13/02/2026)

REFERÊNCIA
Este PRD3 é um “overlay” do PRD2 (v2.3). Ele NÃO substitui o PRD2.
Ele adiciona um objetivo obrigatório e transversal: eliminar qualquer exibição/uso de dado não cadastrado pelo usuário.

REGRA DE OURO (IMUTÁVEL)
Backend (Supabase/Postgres) deve fazer o Frontend funcionar SEM alterar o layout padrão
(apenas correções funcionais e responsivas, sem redesign, sem mudanças estruturais de UI).

PRINCÍPIO-CHAVE (ANTI-DUPLICAÇÃO / ANTI-SOBREPOSIÇÃO)
NADA é criado/reescrito sem antes:
1) VERIFICAR se já existe (repo e banco)
2) MEDIR como está feito (schema real, migrations, seed, hooks, cache)
3) COMPARAR com PRD2 + PRD3 (diff objetivo)
4) DECIDIR a ação mínima:
   - OK (mantém)
   - AJUSTAR (mudança mínima)
   - CRIAR (somente se ausente)
   - DEPRECAR (se duplicado/legado, com plano)

PADRÃO ÚNICO ADOTADO (herdado do PRD2)
- Multi-tenant: org_id é a chave obrigatória de tenancy (Org-First)
- Identidade: auth.users (Supabase Auth)
- PROIBIDO usar “user_id” como nome de coluna nas tabelas de domínio (alvo final)
- Autoria/ator (UUID FK auth.users) em tabelas de domínio:
  - created_by
  - uploaded_by
  - member_id (org_members)
  - actor_id (audit)
  - responsible_id (checklists)
Observação (compatibilidade realista):
- Se o banco hoje ainda tem “user_id” em obras/rdos, isso é DRIFT a ser MIGRADO com backfill,
  sem duplicação de dados e sem quebrar o front.

───────────────────────────────────────────────────────────────────────────────
1) PROBLEMA REAL (O QUE ESTÁ ACONTECENDO)
───────────────────────────────────────────────────────────────────────────────
Sintoma:
- O aplicativo web exibe ou utiliza “informações fictícias” (não cadastradas pelo usuário).

Definição formal de “DADO FICTÍCIO” (proibido):
Qualquer informação apresentada na UI ou usada em regras de negócio que NÃO venha de:
A) uma linha real do banco criada por um membro da organização (org_members) OU
B) dados do próprio Supabase Auth (auth.users / profiles) OU
C) cálculo derivado EXCLUSIVAMENTE de dados reais (ex.: contagem de registros reais)

Exemplos proibidos:
- arrays mock (mockObras, mockRDOs)
- placeholders com nomes de obras/rdos reais “de exemplo”
- objetos fallback com zeros (financeiro: {0,0,0}) quando deveria ser dado real ou “sem dados”
- “atividades={0}” hardcoded para parecer que existe estado real
- cache mostrando dados de outra org/conta por falta de queryKey correta
- seed de domínio sendo exibida como se fosse do usuário final

Objetivo do PRD3:
Garantir que TODAS as funções e telas do app:
- consultem apenas dados cadastrados pelo usuário (membro da org) e/ou dados de auth
- nunca inventem conteúdo
- representem ausência de dados com estado vazio (empty state) ou skeleton, nunca “conteúdo fake”
- respeitem isolamento por org_id em queries, realtime, cache, storage e RLS

───────────────────────────────────────────────────────────────────────────────
2) REGRAS OBRIGATÓRIAS (CONTRATO PRD3)
───────────────────────────────────────────────────────────────────────────────
2.1 “NO FAKE DATA” — regra absoluta
- É PROIBIDO existir mock data em src/ (exceto arquivos explicitamente de teste e ferramentas)
- É PROIBIDO fallback de dados de domínio com valores inventados:
  - se o dado não existe, a UI deve mostrar “Sem dados” / “—” / estado vazio
- É PROIBIDO “hardcode” de contadores/totais que deveriam vir do banco
- É PROIBIDO montar “detalhes” (ex.: obraDetails) com relações vazias fixas para mascarar ausência

Permitido:
- skeleton loaders
- empty states
- placeholders visuais SEM informação semântica de domínio (ex.: “Nenhuma obra cadastrada ainda”)

2.2 “ONLY USER-CREATED DATA” — regra de origem
Para dados de domínio (obras, rdos, equipamentos, fornecedores, documents etc):
- Toda inserção deve preencher created_by/uploaded_by com auth.uid()
- Toda consulta deve:
  A) filtrar por org_id, e
  B) ser protegida por RLS (is_org_member)

2.3 “ORG-BOUND CACHE” — regra de cache e TanStack Query (causa comum de “dados fantasmas”)
Toda query deve obedecer:
- queryKey SEMPRE inclui orgId (e obraId quando aplicável)
  Ex.: ['obras', orgId]
       ['rdos', orgId, obraId]
       ['documents', orgId, obraId, category]
- invalidação/refetch SEMPRE referencia a mesma queryKey com orgId
- ao trocar de org, o app deve:
  - limpar queries daquele “namespace” (ou trocar keys) para evitar reaproveitar cache antigo
  - e reinscrever realtime com filtro do novo orgId

2.4 “REALTIME ISOLATION”
- Realtime subscriptions (se usados) devem filtrar por org_id
- Nunca por user_id em tabelas de domínio
- Callback de realtime deve invalidar apenas keys do org atual

2.5 “SEED NÃO PODE APARECER COMO DADO DO USUÁRIO”
Regra de ambiente:
- Em PRODUÇÃO: não existe seed de domínio (apenas schema/migrations + usuários reais)
- Em DEV local:
  - seed pode existir para facilitar testes, MAS:
    1) deve ser mínimo (org + membro + 1 obra/1 rdo apenas se necessário)
    2) deve ser claramente “DEV SEED” e não pode ser confundido como “dados do usuário final”
    3) ideal: manter seed de domínio DESLIGADA por padrão (opt-in via flag)

Contrato de exibição:
- O frontend não pode renderizar registros seed como “se fossem do usuário” sem que o usuário tenha criado.
Opções permitidas (escolher 1):
A) Seed só cria estrutura (org/membro) e NÃO cria obras/rdos/equipamentos/etc.
B) Seed cria dados de domínio, mas o app só exibe se ENV DEMO_MODE=true.
C) Seed cria dados e marca via coluna is_demo=true (mas isso exige schema extra; só se necessário).

───────────────────────────────────────────────────────────────────────────────
3) PROCESSO OBRIGATÓRIO (EXECUÇÃO PRD3)
───────────────────────────────────────────────────────────────────────────────
3.1 “VARREDURA GERAL” (obrigatória antes de corrigir)
A LLM deve executar varredura completa e produzir/atualizar:
A) INVENTORY (repo + banco + cache layer)
- repo: hooks, pages, components, queryKeys, realtime subscriptions
- banco: tabelas/colunas, RLS, policies
- seed: o que insere
- storage: buckets/policies
B) DIFF_REPORT (PRD2+PRD3 vs realidade)
- classificar por: OK / Diverge / Ausente / Duplicado-Legado
C) FIX_PLAN (mudança mínima)
- lista de mudanças por arquivo + motivo + risco

3.2 Gates anti-duplicação
- Se mock/hardcode existe: REMOVER (não “comentar”)
- Se queryKey não tem orgId: AJUSTAR (não criar hook novo)
- Se coluna no DB diverge (user_id vs created_by): MIGRAR (não criar coluna duplicada sem decisão)
- Se seed causa exibição indevida: REDUZIR seed ou bloquear exibição por flag

───────────────────────────────────────────────────────────────────────────────
4) REQUISITOS TÉCNICOS (O QUE A LLM DEVE GARANTIR NO CÓDIGO)
───────────────────────────────────────────────────────────────────────────────
4.1 Frontend (SEM alterar layout)
Obrigatório em TODOS os hooks que acessam Supabase:
- filtros por org_id
- queryKey inclui orgId
- payload usa created_by/uploaded_by/member_id (sem user_id em domínio)
- status/enums sempre canônicos (ACTIVE/DRAFT etc), nunca PT-BR
- sem parseInt/Number() em UUID

Obrigatório em TODAS as páginas/componentes:
- zero mocks e zero arrays fictícias
- zero “dados default” que aparentem realidade (ex.: obra “Residencial Vista Verde” sem DB)
- estados vazios: exibir empty state, não dados fake
- contadores/totais: derivados do DB ou exibidos como “—” quando indisponíveis

4.2 Backend (RLS como fonte de verdade)
- RLS habilitado em todas as tabelas de domínio
- SELECT: is_org_member(org_id)
- INSERT: is_org_member(org_id) + created_by=auth.uid() (quando aplicável)
- UPDATE/DELETE: role e/ou autor

4.3 Schema (migração sem duplicação)
- Se user_id persiste em tabelas de domínio:
  - planejar migração controlada:
    1) criar created_by (se não existir)
    2) backfill created_by = user_id onde nulo
    3) atualizar front/seed/policies para created_by
    4) remover user_id (ou manter temporariamente com prazo explícito)
- NÃO manter os dois indefinidamente sem regra; isso gera drift eterno.

───────────────────────────────────────────────────────────────────────────────
5) SCRIPTS E PROVAS (OBRIGATÓRIOS)
───────────────────────────────────────────────────────────────────────────────
Regra: “se já existir, ATUALIZAR; se não existir, CRIAR”.

5.1 scripts/verify_no_fake_data.(js|ts)
Objetivo:
- falhar se existir mock data em src/
- falhar se existir hardcode de domínio (listas com nomes/ids) em src/
- falhar se existir fallback semântico (ex.: “Residencial …”) sem DB

Padrões a varrer (exemplos):
- mockObras, mockRDOs, fake, dummy, sample, placeholder
- arrays de objetos com nome/status/data
- “atividades={0}” e similares onde deveria ser dado do DB
Saída:
- arquivo + linha + trecho

5.2 scripts/verify_query_keys.(js|ts)
Objetivo:
- garantir que useQuery/useInfiniteQuery/useMutation invalidations incluem orgId
- detectar keys genéricas (ex.: ['obras']) sem orgId

5.3 scripts/verify_db_contract.(js|ts) (PRD2 + extensão PRD3)
Objetivo:
- enums canônicos ok
- org_id presente nas tabelas de domínio
- created_by/uploaded_by/member_id presentes conforme contrato
- detectar “user_id” em tabelas de domínio (falhar e listar)
- garantir que seed não injeta PT-BR em enums

5.4 Smoke tests (mínimo viável)
- cenário “conta nova / org vazia”:
  - UI deve mostrar empty states, sem dados fictícios
- cenário “criou obra/rdo”:
  - UI lista e detalha corretamente
- cenário “troca de org”:
  - não reaproveitar cache antigo

───────────────────────────────────────────────────────────────────────────────
6) MILESTONES PRD3 (ETAPAS) — SEM “CONCLUÍDO” SEM EVIDÊNCIA
───────────────────────────────────────────────────────────────────────────────
Formato por milestone:
- STATUS: (NÃO INICIADO | EM ANDAMENTO | CONCLUÍDO | BLOQUEADO)
- VALIDAÇÃO: como provar
- EVIDÊNCIA: log/prints/diff obrigatórios

M3.0 — Varredura Geral “Zero Fake Data” (SEM mexer no layout)
STATUS: CONCLUÍDO
Tarefas:
- [x] atualizar INVENTORY com:
  - hooks/pages/components com fallback/hardcode
  - queryKeys que não incluem orgId
  - realtime filters
- [x] atualizar DIFF_REPORT (PRD3 vs realidade)
Validação:
- INVENTORY + DIFF_REPORT atualizados com arquivo+linha
Evidência:
- `docs/INVENTORY.md` (Updated)
- `docs/DIFF_REPORT.md` (Updated)
- `docs/FIX_REPORT.md` (Initial)

M3.1 — Remoção completa de mock/hardcode (UI só mostra o que existe)
STATUS: EM EXECUÇÃO
Tarefas:
- [x] remover mocks (RecentObras/RecentRDOs)
- [ ] substituir fallback semântico por empty state/skeleton (useObraDetails)
- [ ] remover hardcode de zeros/arrays vazias que mascaram falta de query real
Validação:
- verify_no_fake_data PASS
- navegação em conta vazia: sem dados fictícios
Evidência:
- log do script + prints (conta vazia)

M3.2 — Isolamento de cache e queryKeys por org (mata “dados fantasmas”)
STATUS: NÃO INICIADO
Tarefas:
- garantir queryKey com orgId em todos hooks
- ajustar invalidations (queryClient.invalidateQueries) para chaves corretas
- limpar/segregar cache ao trocar org
Validação:
- verify_query_keys PASS
- teste troca de org: zero vazamento visual
Evidência:
- log do script + vídeo/prints

M3.3 — Alinhamento definitivo schema ↔ front (created_by vs user_id)
STATUS: NÃO INICIADO
Tarefas:
- verificar se DB ainda tem user_id em obras/rdos
- se sim: executar migração controlada (backfill + ajuste do front)
- atualizar seed/policies conforme
Validação:
- verify_db_contract PASS (incluindo regra “sem user_id em domínio” OU exceção temporária documentada)
Evidência:
- logs db reset/start + output do script

M3.4 — RLS + Storage sem vazamento (reforço)
STATUS: NÃO INICIADO
Tarefas:
- confirmar policies por org_id em domínio
- confirmar acesso a documents condicionado a org (via tabela + policy)
Validação:
- teste cruzado: usuário de outra org não lê
Evidência:
- prints + queries negadas

M3.5 — Release readiness específico “Zero Fake Data”
STATUS: NÃO INICIADO
Tarefas:
- adicionar checklist PRD3 no RELEASE_CHECKLIST
- documentar regra “conta vazia = UI vazia”
Validação:
- checklist completo + scripts PASS
Evidência:
- logs + checklist

───────────────────────────────────────────────────────────────────────────────
7) CRITÉRIOS DE ACEITE (OBRIGATÓRIOS)
───────────────────────────────────────────────────────────────────────────────
Aceite A — Conta nova / org vazia:
- não aparece obra/rdo/equipamento/fornecedor/documento algum
- UI mostra empty state/skeleton, nunca nomes/dados fictícios

Aceite B — Dados reais:
- ao criar obra/rdo, eles aparecem imediatamente e persistem após reload

Aceite C — Troca de org / troca de conta:
- o que aparece pertence apenas à org ativa do usuário
- zero reaproveitamento visual de cache de outra org

Aceite D — Scripts:
- verify_no_fake_data PASS
- verify_query_keys PASS
- verify_db_contract PASS

───────────────────────────────────────────────────────────────────────────────
8) NOTAS IMPORTANTES (DIRETAS)
───────────────────────────────────────────────────────────────────────────────
1) Remover mock é necessário, mas NÃO suficiente:
   se queryKey não inclui orgId, o app continuará “inventando” dados via cache antigo.

2) Hardcode de zeros/arrays vazias também é “dado fictício”:
   ele cria uma realidade falsa (“financeiro 0”) quando o correto é “sem dados” ou “carregando”.

3) Seed de domínio é perigosa:
   se existir obra/rdo seed e o app não separa dev/demo, o usuário verá “coisas que não cadastrou”.

FIM
