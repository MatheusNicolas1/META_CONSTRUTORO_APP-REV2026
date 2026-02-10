import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { createScopedClient } from '../_shared/supabase-client.ts'
import { requireAuth, requireOrgRole } from '../_shared/guards.ts'
import { writeAuditLog } from '../_shared/audit.ts'
import { writeAuditLog } from '../_shared/audit.ts'
import { logger } from '../_shared/logger.ts'
import { trackServerEvent } from '../_shared/analytics.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const start = performance.now();
  const requestId = crypto.randomUUID();

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let user_id: string | undefined;
  let targetOrgId: string | null = null;

  try {
    const supabaseClient = createScopedClient(req)

    // Guard: Auth
    const user = await requireAuth(supabaseClient)
    user_id = user.id;

    // Guard: Role (Admins Only)
    try {
      if (targetOrgId) {
        await requireOrgRole(supabaseClient, targetOrgId, ['Administrador', 'Proprietário'])
      }
    } catch (e: any) {
      // Fail-safe analytics for forbidden access
      await trackServerEvent(supabaseClient, {
        request_id: requestId,
        source: 'backend',
        org_id: targetOrgId,
        user_id: user.id
      }, {
        event: 'ops.forbidden',
        properties: {
          endpoint: 'create-checkout-session',
          error: e.message
        },
        success: false,
        error: e.message
      });
      throw e;
    }

    // M8.1: Rate Limit (10 req/60s per user)
    const { rateLimitOrThrow } = await import('../_shared/rate-limit.ts')
    await rateLimitOrThrow(supabaseClient, {
      key: `user:${user.id}|fn:create-checkout-session`,
      windowSeconds: 60,
      maxRequests: 10
    })

    const { plan, billing = 'monthly', org_id } = await req.json()

    // M4.3: Get price ID from plans table
    const priceField = billing === 'monthly' ? 'stripe_price_id_monthly' : 'stripe_price_id_yearly'
    const { data: planData, error: planError } = await supabaseClient
      .from('plans')
      .select(`id, ${priceField}`)
      .eq('slug', plan)
      .eq('is_active', true)
      .single()

    if (planError || !planData) {
      throw new Error(`Plan not found or inactive: ${plan}`)
    }

    const priceId = planData[priceField as keyof typeof planData] as string
    if (!priceId) {
      throw new Error(`Stripe price ID not configured for plan ${plan} (${billing})`)
    }

    // M4.3: Get user's org_id (use provided org_id or fallback to personal org)
    targetOrgId = org_id
    if (!targetOrgId) {
      // Get user's personal org (where they are owner)
      const { data: personalOrg } = await supabaseClient
        .from('orgs')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (personalOrg) {
        targetOrgId = personalOrg.id
      } else {
        throw new Error('No org found for user')
      }
    }


    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
      metadata: {
        request_id: requestId,
        user_id: user.id,
        org_id: targetOrgId,
        plan_id: planData.id,
        plan: plan,
        billing: billing,
      },
    })

    const latency = performance.now() - start;
    logger.info(`Session created: ${session.id}`, {
      request_id: requestId,
      function_name: 'create-checkout-session',
      user_id,
      org_id: targetOrgId,
      latency_ms: latency,
      method: req.method,
      status_code: 200
    });

    // M5.3: Audit log billing event
    await writeAuditLog(supabaseClient, {
      org_id: targetOrgId,
      actor_user_id: user.id,
      action: 'billing.checkout_created',
      entity: 'checkout_session',
      entity_id: session.id,
      metadata: {
        plan,
        billing,
        stripe_session_id: session.id,
        amount: priceId ? 'paid' : 'unknown',
      },
      request_id: requestId,
    });

    // M9: Analytics
    await trackServerEvent(supabaseClient, {
      request_id: requestId,
      org_id: targetOrgId,
      user_id: user.id
    }, {
      event: 'ops.checkout_created',
      properties: {
        plan,
        billing,
        amount: priceId ? 'paid' : 'unknown'
      }
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    const duration = performance.now() - start;
    let status = error.message.includes('Unauthorized') ? 401 :
      error.message.includes('Forbidden') ? 403 : 400;

    let errorBody: any = { error: error.message };

    if (error.name === 'RateLimitError') {
      status = 429;
      errorBody = {
        error: 'rate_limited',
        message: error.message,
        reset_at: error.resetAt,
        request_id: requestId,
        retry_after_seconds: 60 // Simple heuristic
      };
    }

    // M9: Analytics Rate Limit & Errors
    if (status === 429) {
      await trackServerEvent(supabaseClient, {
        request_id: requestId,
        source: 'backend',
        org_id: targetOrgId,
        user_id: user_id
      }, {
        event: 'ops.rate_limited',
        properties: {
          function: 'create-checkout-session',
          message: error.message
        },
        success: false
      })
    }

    logger.error(error.message, {
      request_id: requestId,
      function_name: 'create-checkout-session',
      user_id,
      org_id: targetOrgId || undefined,
      latency_ms: duration,
      method: req.method,
      status_code: status
    }, error);

    return new Response(
      JSON.stringify(errorBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    )
  }
})
