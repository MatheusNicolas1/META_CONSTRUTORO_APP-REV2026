# Analytics Events Catalog (Milestone 9)

## Overview
This catalog documents all tracking events implemented in the application. Events are sent to **PostHog** (primary) and backed up to `analytics_events` table (fallback) if PostHog keys are missing.

**Privacy Rule**: No PII (Personally Identifiable Information) such as Email, CPF, Phone, or Addresses should be tracked in properties. Use IDs (UUID) only.

## Core Properties (Standardized 9.3)
All events (Frontend & Backend) include:
- `timestamp`: ISO string
- `environment`: 'production' | 'development'
- `org_id`: UUID (Contextual) or null
- `user_id`: UUID (Contextual) or null
- `role`: String (e.g. 'Administrador', 'system') or null
- `source`: 'frontend' | 'backend'
- `request_id`: UUID (Unique per event/request)
- `app_version`: String (from env)

Backend events also include:
- `success`: Boolean
- `error`: String (if success=false)

---

## 1. Product Events (Frontend)

### `product.obra_created`
- **Trigger**: When a new Obra is successfully created.
- **Location**: `src/hooks/useObras.ts`
- **Properties**: `obra_id`, `tipo`, `localizacao` (State/City only, no strict address)

### `product.obra_updated`
- **Trigger**: When an Obra is updated.
- **Location**: `src/hooks/useObras.ts`
- **Properties**: `obra_id`, `fields_updated`

### `product.obra_deleted`
- **Trigger**: When an Obra is deleted.
- **Location**: `src/hooks/useObras.ts`
- **Properties**: `obra_id`

### `product.rdo_created`
- **Trigger**: When a new RDO draft is created.
- **Location**: `src/hooks/useRDOs.ts`
- **Properties**: `rdo_id`, `obra_id`, `data`

### `product.rdo_submitted`
- **Trigger**: When an RDO is submitted for approval.
- **Location**: `src/hooks/useRDOs.ts`
- **Properties**: `rdo_id`, `status_to`

### `product.attachment_uploaded`
- **Trigger**: When a file upload completes successfully.
- **Location**: `src/components/security/SecureUpload.tsx`
- **Properties**: `file_type`, `file_size`, `file_extension`

---

## 2. Operational Events (Backend)

### `ops.webhook_processed`
- **Trigger**: Stripe webhook successfully processed.
- **Location**: `supabase/functions/stripe-webhook/index.ts`
- **Properties**: `stripe_event_id`, `event_type`, `latency_ms`

### `ops.webhook_failed`
- **Trigger**: Stripe webhook processing failed.
- **Location**: `supabase/functions/stripe-webhook/index.ts`
- **Properties**: `error`, `status_code`

### `ops.checkout_created`
- **Trigger**: Payment checkout session created.
- **Location**: `supabase/functions/create-checkout-session/index.ts`
- **Properties**: `plan`, `billing`, `amount`

### `ops.rate_limited`
- **Trigger**: Rate limit exceeded in Edge Functions.
- **Location**: `supabase/functions/health-check/index.ts` (and standard middleware if applied)
- **Properties**: `function`, `ip` (Anonymized or raw if internal logs only)

### `ops.permission_denied` / `ops.forbidden`
- **Trigger**: When a Guard (requireOrgRole/requireAuth) denies access.
- **Location**: `supabase/functions/create-checkout-session/index.ts`
- **Properties**: `endpoint`, `error`

### `ops.plan_limit_blocked`
- **Trigger**: When `requirePlanLimit` triggers block an INSERT.
- **Location**: Database Triggers (`trigger_enforce_max_users`, `trigger_enforce_max_obras`)
- **Note**: Currently raises an Exception. Future implementation in Edge Functions will track this event directly.

### `ops.invalid_state_transition_blocked`
- **Trigger**: When a state transition (Obra, RDO) is invalid.
- **Location**: Database Triggers.
- **Status**: Exception raised. Frontend catches and displays error.

---

## 3. Implementation Details

### Frontend Wrapper
- **File**: `src/integrations/analytics.ts`
- **Logic**: Auto-attaches `sessionData` (org/user/role) + `request_id`.

### Backend Helper
- **File**: `supabase/functions/_shared/analytics.ts`
- **Logic**: Enforces `AnalyticsContext`. Sends to PostHog. Fallback to `analytics_events` table (INSERT only).

### Fallback Database
- **Table**: `analytics_events`
- **Schema**: `id, created_at, event, org_id, user_id, role, source, properties, environment, request_id, success, error`
- **Security**: RLS Enabled. Service Role: ALL. Auth Users: SELECT (Own Org). INSERT blocked for Auth Users (Service Role only).
- **Immutability**: UPDATE/DELETE blocked by Trigger.
