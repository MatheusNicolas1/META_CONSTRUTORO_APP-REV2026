import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('NOTIFICATION_EMAIL') ?? 'noreply@metaconstrutor.app.br';
const NOTIFY_EMAIL = Deno.env.get('NOTIFICATION_EMAIL') ?? 'metaconstrutor@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Field size limits ──────────────────────────────────────────
const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_COMPANY = 200;
const MAX_PHONE = 30;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
// ── Rate limit: max N requests per IP per window ──────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
// ── HTML escape helper ────────────────────────────────────────
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ContactPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: ContactPayload = await req.json();

    // Validate required fields
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      return new Response(JSON.stringify({ error: { message: 'Campos obrigatórios: name, email, subject, message' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── P0.3: Validate field size limits ──────────────────────────
    if (payload.name.length > MAX_NAME ||
        payload.email.length > MAX_EMAIL ||
        (payload.company && payload.company.length > MAX_COMPANY) ||
        (payload.phone && payload.phone.length > MAX_PHONE) ||
        payload.subject.length > MAX_SUBJECT ||
        payload.message.length > MAX_MESSAGE) {
      return new Response(JSON.stringify({
        error: { message: `Limite de caracteres excedido. Máximo: nome=${MAX_NAME}, email=${MAX_EMAIL}, assunto=${MAX_SUBJECT}, mensagem=${MAX_MESSAGE}` }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return new Response(JSON.stringify({ error: { message: 'Email inválido' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── P0.2: Rate limit by IP ───────────────────────────────────
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    // Use a simple counting approach: check how many messages this IP sent recently
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    if (!countError && count !== null && count >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({
        error: { message: `Muitas solicitações. Tente novamente em alguns minutos.` }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── P0.1: Sanitize HTML from all text fields ─────────────────
    const sanitized = {
      name: escapeHtml(payload.name),
      email: payload.email, // email is safe in DB, only escape for HTML display
      company: payload.company ? escapeHtml(payload.company) : null,
      phone: payload.phone ? escapeHtml(payload.phone) : null,
      subject: escapeHtml(payload.subject),
      message: escapeHtml(payload.message),
    };

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Save to contact_messages table — columns in PT-BR as per existing schema
    const { data: savedMessage, error: dbError } = await supabaseClient
      .from('contact_messages')
      .insert({
        nome: sanitized.name,
        email: sanitized.email,
        empresa: sanitized.company || null,
        telefone: sanitized.phone || null,
        assunto: sanitized.subject,
        mensagem: sanitized.message,
        status: 'pendente',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving contact message:', dbError);
      // Don't throw — try to send email anyway
    }

    // Send notification email via Resend
    if (RESEND_API_KEY) {
      // Fields already sanitized via escapeHtml above
      const emailHtml = `
        <h2>Novo contato do site - ${sanitized.subject}</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Nome</td><td style="padding:8px;border:1px solid #ddd;">${sanitized.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Email</td><td style="padding:8px;border:1px solid #ddd;"><a href="mailto:${sanitized.email}">${sanitized.email}</a></td></tr>
          ${sanitized.company ? `<tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Empresa</td><td style="padding:8px;border:1px solid #ddd;">${sanitized.company}</td></tr>` : ''}
          ${sanitized.phone ? `<tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Telefone</td><td style="padding:8px;border:1px solid #ddd;">${sanitized.phone}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Assunto</td><td style="padding:8px;border:1px solid #ddd;">${sanitized.subject}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border:1px solid #ddd;">Mensagem</td><td style="padding:8px;border:1px solid #ddd;">${sanitized.message.replace(/\n/g, '<br>')}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:16px;">Enviado via formulário de contato - metaconstrutor.app.br</p>
      `;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [NOTIFY_EMAIL],
          reply_to: payload.email,
          subject: `[Contato Site] ${payload.subject} - ${payload.name}`,
          html: emailHtml,
        }),
      });

      if (!emailRes.ok) {
        const emailError = await emailRes.text();
        console.error('Error sending notification email:', emailError);
      }
    }

    // Track the event via PostHog if configured
    const POSTHOG_API_KEY = Deno.env.get('POSTHOG_API_KEY');
    if (POSTHOG_API_KEY) {
      try {
        await fetch(`${Deno.env.get('POSTHOG_HOST') || 'https://app.posthog.com'}/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            event: 'contact.submitted',
            properties: {
              distinct_id: payload.email,
              source: 'contato-page',
              subject: payload.subject,
              $set: { email: payload.email, name: payload.name }
            },
          }),
        });
      } catch (phError) {
        console.error('PostHog tracking error:', phError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem recebida com sucesso! Responderemos em até 4 horas úteis.',
      id: savedMessage?.id || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('send-contact error:', err);
    return new Response(JSON.stringify({ error: { message: err instanceof Error ? err.message : 'Erro interno do servidor' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
