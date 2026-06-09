import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'

serve(async (req) => {
    const start = performance.now()
    const requestId = crypto.randomUUID()

    // Parse JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
        })
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false },
        }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
        })
    }

    // Only POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 405,
        })
    }

    try {
        const body = await req.json()
        const { affiliate_code, referred_email } = body

        if (!affiliate_code || !referred_email) {
            return new Response(
                JSON.stringify({ error: 'affiliate_code and referred_email are required' }),
                { headers: { 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Validate code format
        if (!/^MC[A-Z0-9]{8}$/.test(affiliate_code)) {
            return new Response(JSON.stringify({ error: 'Invalid affiliate code' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Use service_role for internal operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Process the referral via the database function
        const { data: referral_id, error: processError } = await supabaseAdmin.rpc(
            'process_affiliate_referral',
            {
                p_affiliate_code: affiliate_code,
                p_referred_email: referred_email,
                p_referred_user_id: user.id,
            }
        )

        if (processError) {
            // Map known error codes
            const errorMessage = processError.message
            logger.warn(`Referral process failed: ${errorMessage}`, {
                request_id: requestId,
                function_name: 'process-affiliate-referral',
                user_id: user.id,
            }, { affiliate_code, error: processError })

            if (errorMessage.includes('Self-referral')) {
                return new Response(
                    JSON.stringify({ error: 'Autoindicação não permitida' }),
                    { headers: { 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            if (errorMessage.includes('Email already referred')) {
                return new Response(
                    JSON.stringify({ error: 'Este email já foi indicado por outro afiliado' }),
                    { headers: { 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            if (errorMessage.includes('not found or inactive')) {
                return new Response(
                    JSON.stringify({ error: 'Código de afiliado inválido ou inativo' }),
                    { headers: { 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            throw processError
        }

        const latency = performance.now() - start
        logger.info(`✅ Referral created: ${affiliate_code} → ${user.id}`, {
            request_id: requestId,
            function_name: 'process-affiliate-referral',
            user_id: user.id,
            latency_ms: latency,
        })

        return new Response(
            JSON.stringify({
                success: true,
                referral_id,
                message: 'Indicação registrada com sucesso!',
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        logger.error(`Referral processing error: ${error.message}`, {
            request_id: requestId,
            function_name: 'process-affiliate-referral',
        }, error)

        return new Response(
            JSON.stringify({ error: 'Erro ao processar indicação' }),
            { headers: { 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
