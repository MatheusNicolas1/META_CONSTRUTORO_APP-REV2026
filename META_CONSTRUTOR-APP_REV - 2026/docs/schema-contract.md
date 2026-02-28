# Schema Contract & Source of Truth

**Last Updated:** 2026-02-11
**Status:** Living Document

This document defines the **Source of Truth** for the Database Schema, Enums, and Naming Conventions.
All migrations, seeds, and application code MUST adhere to this contract.

## 1. Governance
*   **Source of Truth:** The combination of applied migrations in `supabase/migrations/` is the absolute truth.
*   **Seed Data:** `supabase/seed.sql` must strictly follow the schema defined by migrations.
*   **UI Layers:** May use "Humanized" labels (e.g., "Em Andamento"), but the Database MUST use strict Enum Literals (e.g., 'ACTIVE').

## 2. Enums (Strict Literals)
The following Enums are defined in the database. Usage of any other string value in SQL columns of these types will result in `SQLSTATE 22P02`.

### `app_role`
*   **Defined in:** `20251105175340_.sql`
*   **Values:**
    *   `'Administrador'`
    *   `'Gerente'`
    *   `'Colaborador'`
*   **Notes:** Do NOT use 'owner', 'admin', 'member' in SQL. Map them in UI if needed.

### `obra_status`
*   **Defined in:** `20260209190000_...` & `20260209210000_...`
*   **Values:**
    *   `'DRAFT'` (Rascunho)
    *   `'ACTIVE'` (Em andamento)
    *   `'ON_HOLD'` (Pausada)
    *   `'COMPLETED'` (Concluída)
    *   `'CANCELED'` (Cancelada)

### `rdo_status`
*   **Defined in:** `20260209230000_rdos_status...`
*   **Values:**
    *   `'DRAFT'`
    *   `'SUBMITTED'`
    *   `'APPROVED'`
    *   `'REJECTED'`

### `checklist_status`
*   **Defined in:** `20260211130000_checklists.sql`
*   **Values:**
    *   `'Rascunho'`
    *   `'Em Andamento'`
    *   `'Concluído'`
    *   `'Pendente'`
    *   `'Cancelado'`
    *   *(Note: This enum uses Portuguese values, unlike `obra_status`. Be careful.)*

## 3. Table Schema & Column Mappings
Major tables and their canonical column names.

### `public.orgs`
*   `id` (UUID, PK)
*   `owner_user_id` (UUID, FK -> auth.users)
*   `slug` (Text, Unique)

### `public.org_members`
*   `org_id` (UUID, FK)
*   `user_id` (UUID, FK)
*   `role` (Enum `app_role`)

### `public.obras`
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> User who created/owns)
*   `org_id` (UUID, FK -> Organization)
*   `status` (Enum `obra_status`)

### `public.rdos`
*   **Recreated in:** `20260209231000_recreate_rdos.sql`
*   `id` (UUID, PK)
*   `user_id` (UUID, FK) **(Canonical)** - *Formerly `criado_por_id`*
*   `obra_id` (UUID, FK)
*   `org_id` (UUID, FK)
*   `status` (Enum `rdo_status`)
*   `equipe_ociosa` (Text/Boolean?) -> *Fixed to Boolean in `20260211150000`*

## 4. Deprecated / Removed
*   `atividades` (Table) -> Does not exist. Use `rdo_atividades`?
*   `expenses` (Table) -> Does not exist.
*   `criado_por_id` (Column in `rdos`) -> Renamed to `user_id`.

## 5. Seed Rules
*   Everything inserted into `obras.status` MUST be one of `['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELED']`.
*   Everything inserted into `rdos.status` MUST be one of `['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']`.
*   Use `INSERT INTO ... (...) VALUES (...) ON CONFLICT DO NOTHING`.
