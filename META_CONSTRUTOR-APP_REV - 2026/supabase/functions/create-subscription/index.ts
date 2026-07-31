
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { getCorsHeaders } from '../_shared/cors.ts'
import { createAdminClient, createScopedClient } from '../_shared/supabase-client.ts'
import { ensureBillingUserFoundation, saveStripeCustomerId } from '../_shared/billing-user-foundation.ts'

// --- Funções de validação e aplicação de cupom (padrão create-checkout-session / create-enterprise-checkout) ---

/**
 * Valida um cupom na tabela `coupons` e retorna os dados de desconto.
 * Lança erro se o cupom for inválido/expirado.
 */
async function validateCoupon(supabaseAdmin: any, code: string) {
  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("id, code, discount_type, discount_value, discount_percentage, valid_until, usage_limit, times_used, is_active")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar cupom: ${error.message}`);
  if (!coupon) throw new Error("Cupom inválido ou não encontrado.");
  if (!coupon.is_active) throw new Error("Este cupom não está mais ativo.");
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) throw new Error("Este cupom expirou.");
  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) throw new Error("Este cupom já atingiu o limite de usos.");

  return coupon;
}

/**
 * Cria um Stripe Coupon a partir dos dados do cupom do banco.
 * Retorna o ID do Stripe Coupon.
 */
async function ensureStripeCoupon(stripe: any, coupon: any) {
  if (coupon.discount_type === "percent") {
    const percent = coupon.discount_value || coupon.discount_percentage || 0;
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (${percent}% OFF)`,
      percent_off: percent,
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code,
      },
    });
    return stripeCoupon.id;
  } else if (coupon.discount_type === "fixed") {
    const amountOff = Math.round(Number(coupon.discount_value) * 100);
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (R$ ${coupon.discount_value} OFF)`,
      amount_off: amountOff,
      currency: "brl",
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code,
      },
    });
    return stripeCoupon.id;
  }
  throw new Error("Tipo de desconto inválido");
}

/**
 * Incrementa o contador de uso do cupom no banco.
 */
async function incrementCouponUsage(supabaseAdmin: any, couponId: string) {
  const { error } = await supabaseAdmin.rpc("increment_coupon_usage", {
    coupon_id: couponId,
  });
  if (error) {
    console.error("Erro ao incrementar uso do cupom:", error);
  }
}

Deno.serve(async (req) => {
    const start = performance.now();
    const requestId = crypto.randomUUID();
    const corsHeaders = getCorsHeaders(req);

    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.info(`[${requestId}] Request: ${req.method} ${req.url}`);

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            throw new Error('Missing STRIPE_SECRET_KEY');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error('Invalid JSON body');
        }

        const { plan, billing = 'monthly', user_id: bodyUserId, email: bodyEmail, profile: checkoutProfile = {}, coupon_code } = body;

        if (!plan) throw new Error('Plan is required');
        if (!['monthly', 'yearly'].includes(billing)) throw new Error('Invalid billing cycle');

        // 2. Authentication & Context
        const supabaseClient = createScopedClient(req); // Prioritize Auth header
        const supabaseAdmin = createAdminClient();

        // Get User
        let userId = bodyUserId;
        let userEmail = bodyEmail;

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError) throw authError;
        if (user) {
            userId = user.id;
            userEmail = user.email;
        } else if (!userId) {
            throw new Error('Unauthorized: No user found');
        }
        if (!userEmail) throw new Error('User email not found');

        // 3. Get or repair the account foundation required by billing.
        const foundationUser = user ?? { id: userId, email: userEmail, user_metadata: {} };
        const { profile, orgMember } = await ensureBillingUserFoundation(supabaseAdmin, foundationUser, checkoutProfile);
        const orgId = orgMember?.org_id;
        if (!orgId) throw new Error('Organization not found for user after signup provisioning');

        // 4. Get Price ID from Database
        const priceField = billing === 'monthly' ? 'stripe_price_id_monthly' : 'stripe_price_id_yearly';
        const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select(`id, ${priceField}`)
            .eq('slug', plan)
            .eq('is_active', true)
            .single();

        if (planError || !planData) throw new Error(`Plan not found: ${plan}`);

        const priceId = planData[priceField as keyof typeof planData] as string;
        if (!priceId) throw new Error(`Price ID missing for ${plan} (${billing})`);

        // 5. Get/Create Stripe Customer
        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            console.info(`[${requestId}] Creating new Stripe customer for ${userEmail}`);
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    supabase_user_id: userId,
                    initial_org_id: orgId || ''
                }
            });
            customerId = customer.id;

            await saveStripeCustomerId(supabaseAdmin, userId, customerId);
        }

        // 6. Create Subscription
        // usage: 'off_session' allows us to charge future payments automatically
        console.info(`[${requestId}] Creating subscription for customer ${customerId} with price ${priceId}`);

        // 6a. Aplicar cupom (se fornecido) — padrão create-checkout-session / create-enterprise-checkout
        let appliedCoupon = null;
        let stripeCouponId = null;

        if (coupon_code && coupon_code.trim()) {
            appliedCoupon = await validateCoupon(supabaseAdmin, coupon_code);
            stripeCouponId = await ensureStripeCoupon(stripe, appliedCoupon);
            await incrementCouponUsage(supabaseAdmin, appliedCoupon.id);
        }

        const subscriptionParams: any = {
            customer: customerId,
            items: [{
                price: priceId,
            }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                request_id: requestId,
                user_id: userId,
                org_id: orgId,
                plan_slug: plan,
                billing_cycle: billing,
                coupon_code: appliedCoupon?.code || '',
                coupon_id: appliedCoupon?.id || ''
            }
        };

        // Se um cupom foi aplicado, adiciona o desconto na criação da assinatura
        if (stripeCouponId) {
            subscriptionParams.discounts = [{ coupon: stripeCouponId }];
        }

        const subscription = await stripe.subscriptions.create(subscriptionParams);

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

        console.info(`[${requestId}] Subscription created: ${subscription.id}, ClientSecret: ${paymentIntent.client_secret ? 'Generated' : 'Missing'}`);

        return new Response(
            JSON.stringify({
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
                customerId: customerId
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error(`[${requestId}] Error:`, error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
