import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const headers = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // Only accept POST with JSON body { email: "..." }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Create anon client (RLS allows anon SELECT on leads_prospeccao)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    // Lookup the lead by email
    const { data, error } = await supabase
      .from('leads_prospeccao')
      .select('nome, email, site, estado, cidade')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Supabase query error:', error)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      // Lead não encontrado na base
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    // Lead encontrado — retorna dados
    return new Response(JSON.stringify({
      found: true,
      lead: {
        nome: data.nome || 'Lead',
        email: data.email,
        site: data.site || '',
        estado: data.estado || '',
        cidade: data.cidade || '',
      }
    }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
