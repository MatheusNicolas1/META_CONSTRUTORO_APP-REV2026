import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * signup-guard: Rate limit para signup por IP.
 * 
 * - 3 tentativas por IP a cada 60 segundos.
 * - Resposta genérica: nunca revela se email existe.
 * - Usa a infra existente: tabela rate_limits + RPC check_rate_limit.
 */

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Extrair IP do request
        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const clientIp = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

        // Criar Supabase client com service_role para acessar rate_limits
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verificar rate limit: 3 tentativas por IP a cada 60 segundos
        const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
            p_key: `signup:${clientIp}`,
            p_window_seconds: 60,
            p_max_requests: 3
        });

        if (error) {
            // Fail open: se rate limit check falhar, permitir (log para monitoring)
            console.error('Rate limit check failed:', error.message);
            return new Response(
                JSON.stringify({ allowed: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const result = data?.[0];

        if (!result?.allowed) {
            return new Response(
                JSON.stringify({
                    allowed: false,
                    message: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
                    retryAfter: result?.reset_at
                }),
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'Retry-After': '60'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({ allowed: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        // Erro genérico — nunca expor internals
        console.error('signup-guard error:', err instanceof Error ? err.message : 'unknown');
        return new Response(
            JSON.stringify({ allowed: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
