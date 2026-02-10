import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { writeAuditLog } from '../_shared/audit.ts'
import { writeAuditLog } from '../_shared/audit.ts'
import { logger } from '../_shared/logger.ts'
import { trackServerEvent } from '../_shared/analytics.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Credit mapping based on plan
const PLAN_CREDITS: Record<string, number> = {
    basic: 100,
    professional: 500,
    master: -1, // -1 means unlimited
}

serve(async (req) => {
    const start = performance.now()
    const requestId = crypto.randomUUID()

    const signature = req.headers.get('Stripe-Signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
        logger.error('Webhook signature or secret missing', {
            request_id: requestId,
            function_name: 'stripe-webhook',
            status_code: 400
        })
        return new Response('Webhook signature or secret missing', { status: 400 })
    }

    try {
        const body = await req.text()
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        )

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // M8.1: Rate Limit (120 req/60s per IP)
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const { rateLimitOrThrow } = await import('../_shared/rate-limit.ts')
        await rateLimitOrThrow(supabaseAdmin, {
            key: `ip:${ip}|fn:stripe-webhook`,
            windowSeconds: 60,
            maxRequests: 120
        })

        // M4.4: Check idempotency via stripe_events table
        const { data: existingEvent } = await supabaseAdmin
            .from('stripe_events')
            .select('id, processed')
            .eq('stripe_event_id', event.id)
            .single()

        if (existingEvent?.processed) {
            logger.info(`Event ${event.id} already processed, skipping`, {
                request_id: requestId,
                function_name: 'stripe-webhook'
            }, { event_id: event.id })

            return new Response(JSON.stringify({ received: true, skipped: true }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // M4.4: Record event for idempotency
        const { error: insertError } = await supabaseAdmin
            .from('stripe_events')
            .insert({
                stripe_event_id: event.id,
                event_type: event.type,
                payload: event as any,
                api_version: event.api_version,
                processed: false,
            })

        if (insertError && !insertError.message.includes('duplicate')) {
            logger.error(`Error recording event: ${insertError.message}`, {
                request_id: requestId,
                function_name: 'stripe-webhook'
            }, { event_id: event.id, error: insertError })
        }

        // M5.3: Audit log webhook received
        // Note: org_id from event metadata where available

        let processError: string | null = null
        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session
                    const userId = session.client_reference_id || session.metadata?.user_id
                    const orgId = session.metadata?.org_id

                    if (!userId || !orgId) {
                        logger.error('Missing user_id or org_id in checkout session metadata', {
                            request_id: requestId,
                            function_name: 'stripe-webhook'
                        }, { session_id: session.id })
                        break
                    }

                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    )

                    // M4 STEP 2: Map Stripe price_id to plan_id (do not trust metadata alone)
                    const priceId = subscription.items.data[0]?.price.id
                    if (!priceId) {
                        logger.error('No price_id found in subscription items', {
                            request_id: requestId,
                            function_name: 'stripe-webhook',
                            org_id: orgId,
                            user_id: userId
                        })
                        break
                    }

                    // Find plan by matching stripe_price_id_monthly or stripe_price_id_yearly
                    const { data: monthlyPlan } = await supabaseAdmin
                        .from('plans')
                        .select('id, slug, stripe_price_id_monthly, stripe_price_id_yearly')
                        .eq('stripe_price_id_monthly', priceId)
                        .eq('is_active', true)
                        .single()

                    const { data: yearlyPlan } = await supabaseAdmin
                        .from('plans')
                        .select('id, slug, stripe_price_id_monthly, stripe_price_id_yearly')
                        .eq('stripe_price_id_yearly', priceId)
                        .eq('is_active', true)
                        .single()

                    const plan = monthlyPlan || yearlyPlan
                    const billingCycle = monthlyPlan ? 'monthly' : 'yearly'

                    if (!plan) {
                        logger.error(`Plan not found for price_id: ${priceId}`, {
                            request_id: requestId,
                            function_name: 'stripe-webhook',
                            org_id: orgId
                        })
                        break
                    }

                    logger.info(`✓ Mapped price_id ${priceId} → plan ${plan.slug} (${plan.id}) [${billingCycle}]`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook',
                        org_id: orgId,
                        user_id: userId
                    })

                    // M4.5: Write subscription truth to DB
                    const { error: subError } = await supabaseAdmin
                        .from('subscriptions')
                        .upsert({
                            org_id: orgId,
                            plan_id: plan.id, // from price_id mapping, not metadata
                            stripe_subscription_id: subscription.id,
                            stripe_customer_id: session.customer as string,
                            status: subscription.status as any,
                            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                            billing_cycle: billingCycle,
                        }, { onConflict: 'stripe_subscription_id' })

                    if (subError) {
                        logger.error(`Error creating subscription: ${subError.message}`, {
                            request_id: requestId,
                            function_name: 'stripe-webhook',
                            org_id: orgId
                        }, subError)
                        throw subError
                    }

                    // Legacy: Update profile for compatibility
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscription.id,
                            subscription_status: subscription.status,
                            plan_type: plan.slug, // from mapping, not metadata
                        })
                        .eq('id', userId)

                    logger.info(`✅ Subscription activated for org ${orgId}`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook',
                        org_id: orgId,
                        user_id: userId
                    })

                    // M5.3: Audit subscription creation
                    await writeAuditLog(supabaseAdmin, {
                        org_id: orgId,
                        actor_user_id: userId,
                        action: 'billing.subscription_created',
                        entity: 'subscription',
                        entity_id: subscription.id,
                        metadata: {
                            plan_slug: plan.slug,
                            billing_cycle: billingCycle,
                            status: subscription.status,
                            stripe_event_id: event.id,
                        },
                    });

                    break
                }

                case 'customer.subscription.updated': {
                    const subscription = event.data.object as Stripe.Subscription

                    // M4.5: Update subscription status in DB
                    const { error: updateError } = await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: subscription.status as any,
                            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                        })
                        .eq('stripe_subscription_id', subscription.id)

                    if (updateError) {
                        logger.error(`Error updating subscription: ${updateError.message}`, {
                            request_id: requestId,
                            function_name: 'stripe-webhook'
                        }, { subscription_id: subscription.id, error: updateError })
                    }

                    // Legacy: keep profiles in sync
                    const customerId = subscription.customer as string
                    await supabaseAdmin
                        .from('profiles')
                        .update({ subscription_status: subscription.status })
                        .eq('stripe_customer_id', customerId)

                    logger.info(`✅ Subscription updated: ${subscription.id}`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook'
                    }, { subscription_id: subscription.id })
                    break
                }

                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription

                    // M4.5: Mark subscription as canceled in DB
                    const { error: cancelError } = await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: 'canceled',
                            canceled_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscription.id)

                    if (cancelError) {
                        logger.error(`Error canceling subscription: ${cancelError.message}`, {
                            request_id: requestId,
                            function_name: 'stripe-webhook'
                        }, { subscription_id: subscription.id, error: cancelError })
                    }

                    // Legacy: downgrade profile to free
                    const customerId = subscription.customer as string
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_status: 'canceled',
                            plan_type: 'free',
                            stripe_subscription_id: null,
                        })
                        .eq('stripe_customer_id', customerId)

                    logger.info(`✅ Subscription canceled: ${subscription.id}`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook'
                    }, { subscription_id: subscription.id })
                    break
                }


                case 'invoice.payment_failed': {
                    const invoice = event.data.object as Stripe.Invoice
                    if (invoice.subscription) {
                        await supabaseAdmin
                            .from('subscriptions')
                            .update({ status: 'past_due' })
                            .eq('stripe_subscription_id', invoice.subscription as string)
                    }
                    logger.warn(`⚠️ Payment failed for invoice: ${invoice.id}`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook'
                    }, { invoice_id: invoice.id })
                    break
                }

                default:
                    logger.info(`Unhandled event type: ${event.type}`, {
                        request_id: requestId,
                        function_name: 'stripe-webhook'
                    }, { event_type: event.type })
            }
        } catch (error: any) {
            processError = error.message
            logger.error(`Error processing ${event.type}: ${error.message}`, {
                request_id: requestId,
                function_name: 'stripe-webhook',
                latency_ms: performance.now() - start
            }, error)
        }

        // M4.4: Mark event as processed
        await supabaseAdmin
            .from('stripe_events')
            .update({
                processed: true,
                processed_at: new Date().toISOString(),
                error: processError,
            })
            .eq('stripe_event_id', event.id)

        const latency = performance.now() - start
        logger.info(`Webhook processed in ${latency}ms`, {
            request_id: requestId,
            function_name: 'stripe-webhook',
            latency_ms: latency,
            status_code: 200
        })

        // M9: Analytics Success
        await trackServerEvent(supabaseAdmin, {
            request_id: requestId,
            source: 'backend',
            org_id: null, // Webhook context doesn't always have org_id easily available at this scope unless extracted
            user_id: null
        }, {
            event: 'ops.webhook_processed',
            properties: {
                stripe_event_id: event.id,
                event_type: event.type,
                latency_ms: latency
            },
            success: true
        });

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        const latency = performance.now() - start

        // Handle Rate Limit specifically
        if (error.name === 'RateLimitError') {
            logger.warn(`Rate limit exceeded: ${error.message}`, {
                request_id: requestId,
                function_name: 'stripe-webhook',
                latency_ms: latency,
                status_code: 429
            })
            return new Response(JSON.stringify({
                error: 'rate_limited',
                message: error.message,
                reset_at: error.resetAt,
                retry_after: 60
            }), {
                headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
                status: 429
            })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await trackServerEvent(supabaseAdmin, {
            request_id: requestId,
            source: 'backend'
        }, {
            event: 'ops.webhook_failed',
            properties: {
                error: error.message,
                status_code: 400
            },
            success: false,
            error: error.message
        });


        logger.error(`Webhook error: ${error.message}`, {
            request_id: requestId,
            function_name: 'stripe-webhook',
            latency_ms: latency,
            status_code: 400
        }, error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
