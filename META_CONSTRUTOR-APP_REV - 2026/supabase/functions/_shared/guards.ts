import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// B3: Minimal logging
export const logRequest = (
    requestId: string,
    user_id: string | undefined,
    org_id: string | null,
    endpoint: string,
    result: 'success' | 'denied' | 'error',
    details?: string
) => {
    console.info(JSON.stringify({
        request_id: requestId,
        user_id,
        org_id,
        endpoint,
        result,
        details,
        timestamp: new Date().toISOString()
    }));
}

// Auth Guard
export const requireAuth = async (supabase: SupabaseClient) => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    return user
}

// Org Member Guard
export const requireOrgMember = async (supabase: SupabaseClient, orgId: string) => {
    // Uses the DB helper created in m2.2
    const { data, error } = await supabase.rpc('is_org_member', {
        p_org_id: orgId
    })

    if (error) {
        console.error('RPC is_org_member error:', error)
        throw new Error('Internal Server Error checking permissions')
    }

    if (data !== true) {
        throw new Error('Forbidden: Not an org member')
    }

    return true
}

// Org Role Guard
export const requireOrgRole = async (supabase: SupabaseClient, orgId: string, allowedRoles: string[]) => {
    // Uses the DB helper created in m2.2
    const { data, error } = await supabase.rpc('has_org_role', {
        p_org_id: orgId,
        p_roles: allowedRoles
    })

    if (error) {
        console.error('RPC has_org_role error:', error)
        throw new Error('Internal Server Error checking roles')
    }

    if (data !== true) {
        throw new Error(`Forbidden: Required role not found.`)
    }

    return true
}

// M4.6: Plan Limit Guard
export const requirePlanLimit = async (
    supabase: SupabaseClient,
    orgId: string,
    limitType: 'max_users' | 'max_obras' | 'max_rdo'
) => {
    // Get org's current subscription and plan limits
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
            plan_id,
            status,
            plans!inner(slug, max_users, max_obras, max_rdo)
        `)
        .eq('org_id', orgId)
        .in('status', ['active', 'trialing'])
        .single()

    if (subError || !subscription) {
        // No active subscription = free plan limits
        const { data: freePlan } = await supabase
            .from('plans')
            .select('slug, max_users, max_obras, max_rdo')
            .eq('slug', 'free')
            .single()

        if (!freePlan) {
            throw new Error('Cannot determine plan limits')
        }

        return checkLimit(supabase, orgId, limitType, freePlan)
    }

    const plan = subscription.plans as any
    return checkLimit(supabase, orgId, limitType, plan)
}

async function checkLimit(
    supabase: SupabaseClient,
    orgId: string,
    limitType: 'max_users' | 'max_obras' | 'max_rdo',
    plan: { slug: string; max_users: number | null; max_obras: number | null; max_rdo: number | null }
) {
    const limit = plan[limitType]

    // null = unlimited
    if (limit === null) {
        return true
    }

    // Count current usage
    if (limitType === 'max_users') {
        const { count, error } = await supabase
            .from('org_members')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('status', 'active')

        if (error) {
            throw new Error('Error checking user count')
        }

        if ((count || 0) >= limit) {
            throw new Error(`Plan limit reached: maximum ${limit} users (plan: ${plan.slug})`)
        }
    } else if (limitType === 'max_obras') {
        const { count, error } = await supabase
            .from('obras')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)

        if (error) {
            throw new Error('Error checking obras count')
        }

        if ((count || 0) >= limit) {
            throw new Error(`Plan limit reached: maximum ${limit} obras (plan: ${plan.slug})`)
        }
    } else if (limitType === 'max_rdo') {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { count, error } = await supabase
            .from('rdos')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .gte('created_at', firstDay)

        if (error) {
            throw new Error('Error checking RDO count')
        }

        if ((count || 0) >= limit) {
            throw new Error(`Plan limit reached: maximum ${limit} RDOs per month (plan: ${plan.slug})`)
        }
    }

    return true
}
