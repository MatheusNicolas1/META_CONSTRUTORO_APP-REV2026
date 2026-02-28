# INVENTORY - Meta Construtor App (Updated)

## 1. Domain Tables (Supabase)
| Tabela | Colunas Chave | Status Atual |
| :--- | :--- | :--- |
| `obras` | `id` (uuid), `org_id`, `created_by`, `status` (enum) | `user_id` persists (needs rename/fix). |
| `rdos` | `id` (uuid), `org_id`, `created_by`, `obra_id` | `user_id` persists. |
| `orgs` | `id` (uuid), `owner_user_id` | OK. |
| `org_members` | `org_id`, `user_id`, `role` | OK. |

## 2. Hooks / Data Layer (PRD3 Analysis)
| Hook | Arquivo | Status PRD3 (Org-Bound / No Fake) |
| :--- | :--- | :--- |
| `useObras` | `src/hooks/useObras.ts` | **OK** (Fixed M3). |
| `useRecentObras` | `src/hooks/useRecentObras.ts` | **OK** (Fixed M3). |
| `useRecentRDOs` | `src/hooks/useRecentRDOs.ts` | **OK** (Fixed M3). |
| `useObraDetails` | `src/hooks/useObraDetails.ts` | **Partial**. Needs relationals. |
| `useRDOs` | `src/hooks/useRDOs.ts` | **FAIL**. Uses `user_id` logic (commented?), check keys. |
| `useExpenses` | `src/hooks/useExpenses.ts` | **FAIL**. Uses `user_id`. |
| `useEquipesSupabase` | `src/hooks/useEquipesSupabase.ts` | **FAIL**. Uses `user_id`. |
| `useEquipamentosSupabase` | `src/hooks/useEquipamentosSupabase.ts` | **FAIL**. Uses `user_id`. |
| `useDashboardStats` | `src/hooks/useDashboardStats.ts` | **FAIL**. Uses `user_id`. |
| `useChecklist` | `src/hooks/useChecklist.ts` | **FAIL**. Uses `user_id`. |
| `useActivitiesSupabase` | `src/hooks/useActivitiesSupabase.ts` | **FAIL**. Uses `user_id`. |


## 3. UI Components (Lists/Cards)
| Componente | Arquivo | Problemas Identificados |
| :--- | :--- | :--- |
| `RecentObras` | `src/components/RecentObras.tsx` | Contém `mockObras` (não usado?). Usa `parseInt(id)`. |
| `RecentRDOs` | `src/components/RecentRDOs.tsx` | Contém `mockRDOs`. |
| `Obras` (Page) | `src/pages/Obras.tsx` | Passa `0`, `[]` hardcoded para `ObraExpandableCard`. |

## 4. Types
| Arquivo | Problema |
| :--- | :--- |
| `src/types/obra.ts` | `id: string \| number`. Deveria ser `string` (UUID). |
| `src/types/rdo.ts` | `id: number \| string`. Deveria ser `string` (UUID). |
