
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { getCorsHeaders } from '../_shared/cors.ts'
import { createAdminClient, createScopedClient } from '../_shared/supabase-client.ts'
import { ensureBillingUserFoundation, saveStripeCustomerId } from '../_shared/billing-user-foundation.ts'

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

        const { plan, billing = 'monthly', user_id: bodyUserId, email: bodyEmail, profile: checkoutProfile = {} } = body;

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

        const subscription = await stripe.subscriptions.create({
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
                billing_cycle: billing
            }
        });

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
