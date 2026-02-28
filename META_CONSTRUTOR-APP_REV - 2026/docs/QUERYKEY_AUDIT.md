# Audit: Query Keys & Caching Strategy

## Overview
This audit analyzes all data-fetching hooks to ensure compliance with PRD3 rules:
1.  **Org-Bound Keys**: All query keys must include `orgId`.
2.  **Org-Bound Queries**: All database queries must filter by `org_id` (or `obra_id` -> `org_id`).
3.  **Correct Invalidation**: Mutations must invalidate the specific org-bound keys.

## Findings

| Hook | Query Key | Contains OrgId? | DB Filter | Invalidation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `useObras` | `['obras', orgId]` | ✅ Yes | ✅ `org_id` | ✅ Precise | **PASS** |
| `useRDOs` | `['rdos', orgId]` | ✅ Yes | ✅ `org_id` | ✅ Precise | **PASS** |
| `useRecentObras` | `['recent-obras', orgId]` | ✅ Yes | ✅ `org_id` | N/A (Read) | **PASS** |
| `useRecentRDOs` | `['recent-rdos', orgId]` | ✅ Yes | ✅ `org_id` | N/A (Read) | **PASS** |
| `useDocuments` | `['documentos', orgId, filters]` | ✅ Yes | ✅ `org_id` (logic) | ❌ **BROAD** (`['documentos']`) | **FAIL** (Leaks cache on invalidation) |
| `useChecklist` | `['checklists', filters]` | ❌ **NO** | ❌ `filters` only | ❌ **BROAD** | **FAIL** (Cross-org leak risk) |
| `useActivitiesSupabase` | N/A (State-based) | N/A | ❌ `user_id` | N/A | **FAIL** (Filters by User, not Org) |
| `useDashboardStats` | `['dashboard-stats', orgId]` | ✅ Yes | ❌ `user_id` | N/A | **PARTIAL** (Key OK, Query scopes to User) |
| `useEquipesSupabase` | `['equipes', userId]` | ❌ **NO** | ❌ `user_id` | ❌ **BROAD** | **FAIL** (User separation only, schema drift) |
| `useEquipamentosSupabase` | `['equipamentos', userId]` | ❌ **NO** | ❌ `user_id` | ❌ **BROAD** | **FAIL** (User separation only, schema drift) |
| `useExpenses` | `['expenses', orgId, ...]` | ✅ Yes | ✅ `org_id` | ✅ Precise | **PASS** |

## Critical Issues

### 1. Schema Drift vs Org Requirement
Tables `equipes`, `equipamentos`, and `atividades` (conceptually) are currently fetching by `user_id`.
- **Impact**: Users in multiple orgs will see the same employees/equipment in ALL orgs.
- **Root Cause**: Tables likely missing `org_id` column (confirmed via `types.ts`).
- **Fix Required**: M3.3 Schema Drift (Add columns, backfill, update queries).

### 2. Cache Leaks (Checklist & Documents)
`useChecklist` and `useDocuments` invalidate broadly (`['checklists']`). This forces a refetch for *all* loaded checklists, even if they belong to other org contexts (if concurrently loaded, though unlikely in SPA results in inefficient refetching).
- **Fix Required**: Update keys to `['checklists', orgId, filters]` and invalidate `['checklists', orgId]`.

### 3. User-Bound Hooks
`useEquipesSupabase` uses `['equipes', userId]`. When switching orgs, if the `userId` stays same, the cache persists.
- **Fix Required**: Change key to `['equipes', orgId]` immediately. Logic will still fetch by user (until schema fix), but cache will be logically separated by org.

## Recommendations
1.  **Immediate (M3.2)**: Update ALL Query Keys to include `orgId`. Update `OrgContext` to clear cache on switch.
2.  **Schema (M3.3)**: Add `org_id` to `equipes`, `equipamentos`, `atividades` and update RLS.
