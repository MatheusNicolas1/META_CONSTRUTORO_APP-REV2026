import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'

const ALLOWED_ORIGINS = [
    'https://metaconstrutor.app.br',
    'https://bgdvlhttyjeuprrfxgun.supabase.co',
    'http://localhost:5173',
    'http://localhost:3000',
]

const corsHeaders = (origin: string | null) => {
    const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
}

serve(async (req) => {
    const start = performance.now()
    const requestId = crypto.randomUUID()
    const origin = req.headers.get('Origin')
    const headers = corsHeaders(origin)

    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers, status: 204 })
    }

    // Only GET requests
    if (req.method !== 'GET') {
        return new Response('Method not allowed', { headers, status: 405 })
    }

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('ref')

        if (!code) {
            return new Response('Missing ref parameter', { headers, status: 400 })
        }

        // Validate code format: MC + 8 alphanumeric chars
        if (!/^MC[A-Z0-9]{8}$/.test(code)) {
            return new Response('Invalid affiliate code format', { headers, status: 400 })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Lookup affiliate profile
        const { data: affiliate, error: affiliateError } = await supabaseAdmin
            .from('affiliate_profiles')
            .select('id, user_id, status')
            .eq('affiliate_code', code)
            .single()

        if (affiliateError || !affiliate) {
            logger.warn(`Affiliate code not found: ${code}`, {
                request_id: requestId,
                function_name: 'affiliate-tracker',
            }, { code })
            // Don't reveal whether code is valid — redirect to home
            return Response.redirect('https://metaconstrutor.app.br', 302)
        }

        if (affiliate.status !== 'active') {
            logger.warn(`Inactive affiliate tried to use code: ${code}`, {
                request_id: requestId,
                function_name: 'affiliate-tracker',
            }, { affiliate_id: affiliate.id, status: affiliate.status })
            return Response.redirect('https://metaconstrutor.app.br', 302)
        }

        // Get visitor info
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown'
        const userAgent = req.headers.get('user-agent') || ''
        const referrerUrl = req.headers.get('referer') || ''

        // Register click
        const { error: clickError } = await supabaseAdmin
            .from('affiliate_clicks')
            .insert({
                affiliate_id: affiliate.id,
                visitor_ip: ip,
                visitor_agent: userAgent.slice(0, 500),
                referrer_url: referrerUrl.slice(0, 1000),
            })

        if (clickError) {
            logger.error(`Error recording click: ${clickError.message}`, {
                request_id: requestId,
                function_name: 'affiliate-tracker',
            }, { affiliate_id: affiliate.id, error: clickError })
        }

        // Update click counter
        await supabaseAdmin.rpc('increment_affiliate_clicks', {
            p_affiliate_id: affiliate.id,
        }).catch(() => {
            // Non-critical, ignore failure
        })

        // Build redirect URL with ?ref=CODE for client-side cookie handling
        const redirectUrl = new URL('https://metaconstrutor.app.br')
        redirectUrl.searchParams.set('ref', code)

        const response = Response.redirect(redirectUrl.toString(), 302)

        // Set cookie: affiliate_ref, 90 days expiry
        const cookieExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        response.headers.set(
            'Set-Cookie',
            `affiliate_ref=${code}; Path=/; Expires=${cookieExpiry.toUTCString()}; SameSite=Lax; Secure`
        )

        const latency = performance.now() - start
        logger.info(`Affiliate click tracked: ${code} → ${ip}`, {
            request_id: requestId,
            function_name: 'affiliate-tracker',
            affiliate_id: affiliate.id,
            latency_ms: latency,
        })

        return response

    } catch (error: any) {
        logger.error(`Affiliate tracker error: ${error.message}`, {
            request_id: requestId,
            function_name: 'affiliate-tracker',
        }, error)

        // Always redirect to home on error
        return Response.redirect('https://metaconstrutor.app.br', 302)
    }
})
