
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { createScopedClient } from '../_shared/supabase-client.ts'

const getStripe = () => {
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) {
        throw new Error('Missing STRIPE_SECRET_KEY');
    }
    return new Stripe(key, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    });
};

Deno.serve(async (req) => {
    const start = performance.now();
    const requestId = crypto.randomUUID();

    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log(`[${requestId}] Request: ${req.method} ${req.url}`);

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

        const { plan, billing = 'monthly', user_id: bodyUserId, email: bodyEmail } = body;

        if (!plan) throw new Error('Plan is required');

        // 2. Authentication & Context
        const supabaseClient = createScopedClient(req); // Prioritize Auth header

        // Get User
        let userId = bodyUserId;
        let userEmail = bodyEmail;

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (user) {
            userId = user.id;
            userEmail = user.email;
        } else if (!userId) {
            throw new Error('Unauthorized: No user found');
        }

        // 3. Get Organization (Critical for B2B/SaaS)
        // Try to find an organization owned by this user
        // We assume 1 main org per user for the subscription context for now
        const { data: orgMember } = await supabaseClient
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .eq('role', 'owner') // Only owners should subscribe? Or at least member
            .limit(1)
            .single();

        // If no org found, we might need to create one or handle it. 
        // For now, let's assume if no org, we use user_id as fallback or fail if org mandatory.
        // But the previous code didn't handle orgs. We will Add org_id to metadata if matches.
        const orgId = orgMember?.organization_id;

        // 4. Get Price ID from Database
        const priceField = billing === 'monthly' ? 'stripe_price_id_monthly' : 'stripe_price_id_yearly';
        const { data: planData, error: planError } = await supabaseClient
            .from('plans')
            .select(`id, ${priceField}`)
            .eq('slug', plan)
            .eq('is_active', true)
            .single();

        if (planError || !planData) throw new Error(`Plan not found: ${plan}`);

        const priceId = planData[priceField as keyof typeof planData] as string;
        if (!priceId) throw new Error(`Price ID missing for ${plan} (${billing})`);

        // 5. Get/Create Stripe Customer
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            console.log(`[${requestId}] Creating new Stripe customer for ${userEmail}`);
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    supabase_user_id: userId,
                    initial_org_id: orgId || ''
                }
            });
            customerId = customer.id;

            // Save to profile
            await supabaseClient
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        // 6. Create Subscription
        // usage: 'off_session' allows us to charge future payments automatically
        console.log(`[${requestId}] Creating subscription for customer ${customerId} with price ${priceId}`);

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
                org_id: orgId || '', // Store org_id in metadata for webhook
                plan_slug: plan,
                billing_cycle: billing
            }
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

        console.log(`[${requestId}] Subscription created: ${subscription.id}, ClientSecret: ${paymentIntent.client_secret ? 'Generated' : 'Missing'}`);

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
