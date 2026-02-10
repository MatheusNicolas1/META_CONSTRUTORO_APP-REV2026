import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { trackServerEvent } from '../_shared/analytics.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    const start = performance.now()
    const requestId = crypto.randomUUID()

    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // M8.1: Rate Limit (TEST: 2 req/60s per IP)
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        // Inline logic validation
        const { data: rlData, error: rlError } = await supabaseClient.rpc('check_rate_limit', {
            p_key: `ip:${ip}|fn:health-check`,
            p_window_seconds: 60,
            p_max_requests: 2
        });

        if (rlError) {
            console.error('Rate Limit RPC Error:', rlError)
        } else if (rlData && rlData.length > 0) {
            const { allowed, reset_at } = rlData[0]
            if (!allowed) {
                // M9: Analytics Rate Limit
                // Note: supabaseClient here might be Anon, but we need Admin for Fallback DB insert if strictly RLS protected.
                // However, let's assume PostHog First or Service Role if available.
                // For health-check, we usually don't have a user.
                await trackServerEvent(supabaseClient, {
                    request_id: crypto.randomUUID(),
                    source: 'backend'
                }, {
                    event: 'ops.rate_limited',
                    properties: {
                        function: 'health-check',
                        ip: ip
                    },
                    success: false
                });

                return new Response(JSON.stringify({
                    error: 'rate_limited',
                    message: 'Too Many Requests',
                    reset_at: reset_at,
                    request_id: requestId,
                    retry_after_seconds: 60
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
                    status: 429,
                })
            }
        }

        // 1. Check DB Connection
        const { error: dbError } = await supabaseClient.from('orgs').select('id').limit(1).single()
        const dbOk = !dbError

        // 2. Check Stripe Event Queue (Pending)
        const { count: pendingCount, error: pendingError } = await supabaseClient
            .from('stripe_events')
            .select('*', { count: 'exact', head: true })
            .eq('processed', false)

        // 3. Check Stripe Event Failures
        const { count: errorCount, error: errorError } = await supabaseClient
            .from('stripe_events')
            .select('*', { count: 'exact', head: true })
            .not('error', 'is', null)

        const latency = performance.now() - start

        const healthData = {
            status: dbOk ? 'ok' : 'degraded',
            time: new Date().toISOString(),
            request_id: requestId,
            checks: {
                database: dbOk,
                stripe_events_pending: pendingCount ?? -1,
                stripe_events_errors: errorCount ?? -1,
            },
            latency_ms: latency
        }

        return new Response(JSON.stringify(healthData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: dbOk ? 200 : 503,
        })

    } catch (error: any) {
        // Handle Rate Limit (Name check or Message check fallback)
        if (error.name === 'RateLimitError' || error.message?.includes('Too Many Requests')) {
            const resetAt = error.resetAt || new Date(Date.now() + 60000).toISOString();
            return new Response(JSON.stringify({
                error: 'rate_limited',
                message: error.message || 'Too Many Requests',
                reset_at: resetAt,
                request_id: requestId,
                retry_after_seconds: 60
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
                status: 429,
            })
        }

        return new Response(JSON.stringify({
            status: 'error',
            message: error.message,
            error_name: error.name // Debug info
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
