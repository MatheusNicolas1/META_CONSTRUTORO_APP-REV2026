// M5.2: Server-side audit log writer
// Used by edge functions to write immutable audit logs

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface AuditLogPayload {
    org_id: string
    action: string
    entity: string
    entity_id?: string | null
    actor_user_id?: string | null
    metadata?: Record<string, any>
    request_id?: string | null
    ip?: string | null
    user_agent?: string | null
}

/**
 * Write an immutable audit log entry via service_role client
 * @param adminClient - SupabaseClient with service_role key
 * @param payload - Audit log data (org_id, action, entity required)
 * @returns Inserted audit log row or throws error
 */
export async function writeAuditLog(
    adminClient: SupabaseClient,
    payload: AuditLogPayload
) {
    // Validate required fields
    if (!payload.org_id) {
        throw new Error('audit: org_id is required')
    }
    if (!payload.action) {
        throw new Error('audit: action is required')
    }
    if (!payload.entity) {
        throw new Error('audit: entity is required')
    }

    // Insert audit log (service_role bypasses RLS)
    const { data, error } = await adminClient
        .from('audit_logs')
        .insert({
            org_id: payload.org_id,
            actor_user_id: payload.actor_user_id || null,
            action: payload.action,
            entity: payload.entity,
            entity_id: payload.entity_id || null,
            metadata: payload.metadata || {},
            request_id: payload.request_id || null,
            ip: payload.ip || null,
            user_agent: payload.user_agent || null,
        })
        .select('id, created_at, action')
        .single()

    if (error) {
        console.error('writeAuditLog error:', error)
        throw new Error(`Failed to write audit log: ${error.message}`)
    }

    console.info(`✓ Audit log written: ${data.action} (${data.id}) at ${data.created_at}`)
    return data
}
