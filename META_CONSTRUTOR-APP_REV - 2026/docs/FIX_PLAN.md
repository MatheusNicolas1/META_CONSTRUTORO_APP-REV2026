# Fix Plan: Org-Bound Cache & Security (Executed)

## Overview
This document summarizes the minimal changes applied to enforce Org-Bound Caching and improve security, as per Milestone 3.2.

## Applied Changes

### 1. `src/hooks/useChecklist.ts`
- **Issue**: Missing `org_id` filter and broad cache invalidation.
- **Fix**:
    - Added `requrieOrg` hook.
    - Added `.eq('org_id', orgId)` to `fetchChecklists`.
    - Updated Query Key: `['checklists', orgId, filters]`.
    - Updated Invalidation: `['checklists', orgId]`.

### 2. `src/hooks/useDocuments.ts`
- **Issue**: Broad invalidation `['documentos']`.
- **Fix**:
    - Updated Invalidation: `['documentos', orgId]`.
    - Kept existing query logic (which correctly filters by `orgId`).

### 3. `src/hooks/useEquipesSupabase.ts`
- **Issue**: Cache key `['equipes', userId]` caused cross-org leaking given user is same.
- **Fix**:
    - Updated Query Key: `['equipes', orgId]`. (Note: Query still filters by `user_id` due to schema drift, but cache is now isolated).
    - Added `// @ts-ignore` to suppress schema drift type error on Insert.

### 4. `src/hooks/useActivitiesSupabase.ts`
- **Issue**: State persisted across org switch.
- **Fix**:
    - Added `setActivities([])` effect when `orgId` changes to visually clear the old data immediately.

### 5. `src/contexts/OrgContext.tsx`
- **Issue**: No cache clearing on org switch.
- **Fix**:
    - Added `queryClient.removeQueries()` in `setActiveOrgId` to guarantee fresh state when switching organizations.

## Next Steps (M3.3)
- **Schema Drift**: Add `org_id` column to `equipes`, `equipamentos`, `atividades`.
- **Type Alignment**: Update `types.ts` or DB generation to reflect new columns.
- **Query Updates**: Switch from `user_id` to `org_id` in `useEquipesSupabase`, etc.
