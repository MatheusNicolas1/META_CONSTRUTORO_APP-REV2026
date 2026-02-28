# Audit: Org Switch & Realtime Isolation

## Overview
This audit analyzes `OrgContext.tsx` and related logic to ensure proper cleanup when switching organizations.

## Findings

| Aspect | Current Behavior | Issue | Status |
| :--- | :--- | :--- | :--- |
| **Org Switch Trigger** | `setActiveOrgId` updates state & local storage. | Syncs `role`, updates state. | **PASS** |
| **Cache Cleanup** | **NONE**. Only refreshes specific hooks if they depend on `orgId`. | Stale queries from previous org remain in React Query cache. Can leak if keys don't include `orgId`. | **FAIL** |
| **Realtime** | Hooks subscribe based on `orgId` dep. | `useEffect` cleanup runs correctly when `orgId` changes. The robust implementation with Registry handles unsubscription. | **PASS** |
| **Access Control** | Updates `role` on switch. | Seems correct. Relies on RLS for DB access. | **PASS** |

## Critical Issues

### 1. Missing Cache Purge
When `setActiveOrgId` is called, there is no call to `queryClient.removeQueries()` or similar.
- **Impact**: While hooks with `[key, orgId]` will switch to a new empty cache (good), data from the *previous* org remains in memory until garbage collected. If a user switches back, it's there (good for perceived perf, but bad for security/isolation if not strictly controlled).
- **Hard Refresh**: Hooks *without* `orgId` in key (e.g. `useChecklist`) will NOT refresh and will show data from the *previous* org! This is a **Realtime Leak**.

## Recommendations

1.  **Strict Isolation**: `OrgContext` must call `queryClient.removeQueries()` (or `invalidateQueries` to force refresh, but remove is safer for total isolation) when `activeOrgId` changes.
2.  **Fix Hooks**: All hooks MUST depend on `orgId`. (See QUERYKEY_AUDIT.md).
