# DIFF REPORT - Contract vs Reality (Updated)

## 1. Mock Data / Hardcoding
- [x] **RecentObras.tsx**: `mockObras` array exists.
- [x] **RecentRDOs.tsx**: `mockRDOs` array exists with fake data ("Residencial Vista Verde", etc).
- [x] **useObraDetails.ts**:
  - `equipes: []` (Hardcoded empty)
  - `equipamentos: []` (Hardcoded empty)
  - `financeiro: { ... 0 ... }` (Hardcoded zeros)
- [x] **Obras.tsx**: Passa `atividades={0}` para os cards.

## 2. Type Mismatch (UUID vs Number)
- [x] **Obra Type**: `id: string | number`. DB is `uuid`.
- [x] **RDO Type**: `id: number | string`. DB is `uuid` (probably, checking migration).
- [x] **Use usage**: `RecentObras.tsx` calls `parseInt(obra.id)`, which will return `NaN` for UUIDs.

## 3. Query Filtering (Multi-tenant Violation)
- [x] **useObras**: `.eq('user_id', user.id)`. Viola regra "Filter by org_id". Obras de outros membros da mesma org não aparecem.
- [x] **useRecentObras**: `.eq('user_id', user.id)`. Mesmo problema.
- [x] **useRecentRDOs**: `.eq('user_id', user.id)`. Mesmo problema.

## 4. Realtime Isolation (PRD3 Rule 2.4)
- [x] **useObras**: OK (`org_id`).
- [x] **useRDOs**: OK (`org_id`).
- [ ] **Other Hooks**: Likely missing `filter: org_id=...`.

## 5. Column Names (Schema Drift - PRD3 Rule 4.3)
- [ ] **user_id persistence**: `verify_db_contract` detected `user_id` in `obras` (Forbidden).
- [ ] **created_by missing**: `verify_db_contract` detected missing `created_by` in `obras`, `rdos`.
- [ ] **org_id missing**: `verify_db_contract` detected missing `org_id` in `documentos`.

## 6. Org-Bound Cache (PRD3 Rule 2.3)
- [ ] **Query Keys**: `useExpenses`, `useEquipes*`, `useDashboard*` likely missing `orgId` in keys.

