import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { writeAuditLog } from '../_shared/audit.ts'
import { logger } from '../_shared/logger.ts'
import { trackServerEvent } from '../_shared/analytics.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const toStripeTimestampIso = (value: unknown): string | null => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
    }

    const date = new Date(value * 1000)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const getSubscriptionPeriod = (subscription: Stripe.Subscription) => {
    const subscriptionWithPeriod = subscription as Stripe.Subscription & {
        current_period_start?: number | null
        current_period_end?: number | null
    }
    const firstItem = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & {
        current_period_start?: number | null
        current_period_end?: number | null
    }) | undefined

    return {
        current_period_start: toStripeTimestampIso(subscriptionWithPeriod.current_period_start ?? firstItem?.current_period_start),
        current_period_end: toStripeTimestampIso(subscriptionWithPeriod.current_period_end ?? firstItem?.current_period_end),
        trial_end: toStripeTimestampIso(subscription.trial_end),
    }
}

const getPlanForSubscription = async (supabaseAdmin: any, subscription: Stripe.Subscription) => {
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) return { plan: null, billingCycle: null, priceId: null }

    const { data: monthlyPlan } = await supabaseAdmin
        .from('plans')
        .select('id, slug, stripe_price_id_monthly, stripe_price_id_yearly')
        .eq('stripe_price_id_monthly', priceId)
        .eq('is_active', true)
        .maybeSingle()

    if (monthlyPlan) return { plan: monthlyPlan, billingCycle: 'monthly', priceId }

    const { data: yearlyPlan } = await supabaseAdmin
        .from('plans')
        .select('id, slug, stripe_price_id_monthly, stripe_price_id_yearly')
        .eq('stripe_price_id_yearly', priceId)
        .eq('is_active', true)
        .maybeSingle()

    return { plan: yearlyPlan || null, billingCycle: yearlyPlan ? 'yearly' : null, priceId }
}

// ============================================================================
// PRD06: Programa de Afiliados — Processamento de Comissões
// ============================================================================

interface AffiliateCommissionInput {
    affiliateId: string
    referredUserId: string
    subscriptionId: string
    amount: number
    percentage: number
}

/**
 * Gera uma comissão de afiliado com base no pagamento aprovado.
 * 1. Localiza o referral ativo (pending/converted) para o usuário indicado
 * 2. Verifica autoindicação (afiliado ≠ indicado)
 * 3. Calcula 40% do valor líquido
 * 4. Insere na tabela affiliate_commissions
 */
async function processAffiliateCommission(
    supabaseAdmin: any,
    referredUserId: string,
    invoice: Stripe.Invoice
): Promise<void> {
    // 1. Localizar referral ativo
    const { data: referral } = await supabaseAdmin
        .from('affiliate_referrals')
        .select('id, affiliate_id, status')
        .eq('referred_user_id', referredUserId)
        .in('status', ['pending', 'converted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!referral) {
        logger.info('[Affiliate] No active referral found for user, skipping commission', {
            referred_user_id: referredUserId
        })
        return
    }

    // 2. Verificar autoindicação (Módulo 09 — Anti-fraude)
    if (referral.affiliate_id === referredUserId) {
        logger.warn('[Affiliate] Self-referral detected, commission blocked', {
            affiliate_id: referral.affiliate_id,
            referred_user_id: referredUserId
        })
        return
    }

    // 3. Calcular comissão: 40% do valor líquido
    // Valor líquido = total pago pelo cliente (após descontos/cupons)
    const amountPaid = (invoice.amount_paid || invoice.total || 0) / 100 // Stripe cents → reais
    const commissionPercentage = 40 // fixo 40%
    const commissionAmount = Number((amountPaid * (commissionPercentage / 100)).toFixed(2))

    if (commissionAmount <= 0) {
        logger.info('[Affiliate] Commission amount is zero or negative, skipping', {
            amount_paid: amountPaid,
            commission: commissionAmount
        })
        return
    }

    // 4. Inserir comissão
    const { error: commissionError } = await supabaseAdmin
        .from('affiliate_commissions')
        .insert({
            affiliate_id: referral.affiliate_id,
            referral_id: referral.id,
            subscription_id: invoice.subscription as string || null,
            amount: commissionAmount,
            percentage: commissionPercentage,
            status: 'approved', // Aprovado porque invoice.payment_succeeded já confirmou
        })

    if (commissionError) {
        logger.error(`[Affiliate] Error creating commission: ${commissionError.message}`, {
            affiliate_id: referral.affiliate_id,
            referral_id: referral.id
        }, commissionError)
        return
    }

    // 5. Atualizar status do referral para 'converted'
    await supabaseAdmin
        .from('affiliate_referrals')
        .update({ status: 'converted' })
        .eq('id', referral.id)

    logger.info(`[Affiliate] Commission created: R$${commissionAmount} (${commissionPercentage}%)`, {
        affiliate_id: referral.affiliate_id,
        referral_id: referral.id,
        amount: commissionAmount,
        percentage: commissionPercentage
    })
}

/**
 * Remove (cancela) comissões de afiliado quando há cancelamento ou reembolso.
 */
async function cancelAffiliateCommissions(
    supabaseAdmin: any,
    subscriptionId: string
): Promise<void> {
    const { data: commissions } = await supabaseAdmin
        .from('affiliate_commissions')
        .select('id, status')
        .eq('subscription_id', subscriptionId)
        .in('status', ['pending', 'approved', 'paid'])

    if (!commissions || commissions.length === 0) return

    const commissionIds = commissions.map((c: any) => c.id)

    const { error } = await supabaseAdmin
        .from('affiliate_commissions')
        .update({ status: 'refunded' })
        .in('id', commissionIds)

    if (error) {
        logger.error(`[Affiliate] Error canceling commissions: ${error.message}`, {
            subscription_id: subscriptionId
        }, error)
        return
    }

    logger.info(`[Affiliate] ${commissions.length} commission(s) marked as refunded`, {
        subscription_id: subscriptionId,
        commission_ids: commissionIds
    })
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

        // Idempotency Check
        const { data: existingEvent } = await supabaseAdmin
            .from('stripe_events')
            .select('id, processed')
            .eq('stripe_event_id', event.id)
            .single()

        if (existingEvent?.processed) {
            return new Response(JSON.stringify({ received: true, skipped: true }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Record event
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

        let processError: string | null = null

        try {
            switch (event.type) {
                case 'invoice.payment_succeeded': {
                    const invoice = event.data.object as Stripe.Invoice;
                    if (!invoice.subscription) break;

                    const subscriptionId = invoice.subscription as string;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0]?.price.id;

                    // Metadata source: Check subscription metadata first, then invoice metadata
                    const userId = subscription.metadata?.user_id || invoice.metadata?.user_id;
                    const orgId = subscription.metadata?.org_id || invoice.metadata?.org_id;

                    // Find Plan
                    const { data: monthlyPlan } = await supabaseAdmin
                        .from('plans')
                        .select('id, slug')
                        .eq('stripe_price_id_monthly', priceId)
                        .eq('is_active', true)
                        .single();

                    const { data: yearlyPlan } = await supabaseAdmin
                        .from('plans')
                        .select('id, slug')
                        .eq('stripe_price_id_yearly', priceId)
                        .eq('is_active', true)
                        .single();

                    const plan = monthlyPlan || yearlyPlan;
                    const billingCycle = monthlyPlan ? 'monthly' : 'yearly';

                    if (plan && orgId) {
                        const period = getSubscriptionPeriod(subscription);

                        // Upsert Subscription
                        const subscriptionData = {
                            stripe_subscription_id: subscription.id,
                            stripe_customer_id: subscription.customer as string,
                            stripe_price_id: priceId,
                            org_id: orgId,
                            status: subscription.status,
                            plan_id: plan.id,
                            billing_cycle: billingCycle,
                            current_period_start: period.current_period_start,
                            current_period_end: period.current_period_end,
                            trial_end: period.trial_end,
                            metadata: subscription.metadata
                        };

                        await supabaseAdmin
                            .from('subscriptions')
                            .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

                        // Update User Profile
                        if (userId) {
                            await supabaseAdmin
                                .from('profiles')
                                .update({
                                    stripe_subscription_id: subscription.id,
                                    subscription_status: subscription.status,
                                    plan_type: plan.slug
                                })
                                .eq('id', userId);

                            // PRD06: Processar comissão de afiliado no pagamento aprovado
                            await processAffiliateCommission(supabaseAdmin, userId, invoice);
                        }
                    } else {
                        throw new Error(`Missing ${!plan ? 'plan mapping' : 'org_id'} for subscription ${subscription.id}`);
                    }
                    break;
                }

                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session
                    const userId = session.client_reference_id || session.metadata?.user_id
                    const orgId = session.metadata?.org_id
                    // Cupom: incrementa uso se coupon_id estiver na metadata
                    const couponId = session.metadata?.coupon_id
                    if (couponId) {
                        const { error: couponError } = await supabaseAdmin.rpc("increment_coupon_usage", { coupon_id: couponId })
                        if (couponError) {
                            logger.error(`Error incrementing coupon usage: ${couponError.message}`, {
                                request_id: requestId,
                                function_name: 'stripe-webhook'
                            }, { coupon_id: couponId, session_id: session.id })
                        } else {
                            logger.info(`✓ Coupon usage incremented for coupon ${couponId}`, {
                                request_id: requestId,
                                function_name: 'stripe-webhook',
                                coupon_id: couponId
                            })
                        }
                    }

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

                    const period = getSubscriptionPeriod(subscription)

                    // M4.5: Write subscription truth to DB
                    const { error: subError } = await supabaseAdmin
                        .from('subscriptions')
                        .upsert({
                            org_id: orgId,
                            plan_id: plan.id, // from price_id mapping, not metadata
                            stripe_subscription_id: subscription.id,
                            stripe_customer_id: session.customer as string,
                            status: subscription.status as any,
                            current_period_start: period.current_period_start,
                            current_period_end: period.current_period_end,
                            trial_end: period.trial_end,
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
                    const subscription = event.data.object as Stripe.Subscription;
                    const period = getSubscriptionPeriod(subscription);
                    const { plan, billingCycle, priceId } = await getPlanForSubscription(supabaseAdmin, subscription);

                    const subscriptionUpdate: Record<string, unknown> = {
                        status: subscription.status,
                        current_period_start: period.current_period_start,
                        current_period_end: period.current_period_end,
                        canceled_at: toStripeTimestampIso(subscription.canceled_at),
                    };

                    if (plan && billingCycle && priceId) {
                        subscriptionUpdate.plan_id = plan.id;
                        subscriptionUpdate.billing_cycle = billingCycle;
                        subscriptionUpdate.stripe_price_id = priceId;
                    }

                    await supabaseAdmin
                        .from('subscriptions')
                        .update(subscriptionUpdate)
                        .eq('stripe_subscription_id', subscription.id);

                    if (plan) {
                        const customerId = typeof subscription.customer === 'string'
                            ? subscription.customer
                            : subscription.customer.id;

                        await supabaseAdmin
                            .from('profiles')
                            .update({
                                stripe_customer_id: customerId,
                                stripe_subscription_id: subscription.id,
                                subscription_status: subscription.status,
                                plan_type: plan.slug,
                            })
                            .eq('stripe_customer_id', customerId);
                    }
                    break;
                }

                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    await supabaseAdmin
                        .from('subscriptions')
                        .update({
                            status: 'canceled',
                            canceled_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscription.id);

                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_status: 'canceled',
                            plan_type: 'free'
                        })
                        .eq('stripe_customer_id', subscription.customer as string);

                    // PRD06: Cancelar comissões de afiliado vinculadas a esta assinatura
                    await cancelAffiliateCommissions(supabaseAdmin, subscription.id);
                    break;
                }

                case 'charge.refunded': {
                    const charge = event.data.object as Stripe.Charge;
                    if (charge.invoice && charge.paid === false) {
                        logger.info('[Affiliate] Refund detected, checking for commissions to revoke', {
                            request_id: requestId,
                            function_name: 'stripe-webhook',
                            charge_id: charge.id,
                            invoice_id: charge.invoice as string
                        }, { charge_id: charge.id, invoice_id: charge.invoice });

                        // Buscar a invoice para obter o subscription_id
                        const invoice = await stripe.invoices.retrieve(charge.invoice as string);
                        if (invoice.subscription) {
                            await cancelAffiliateCommissions(supabaseAdmin, invoice.subscription as string);
                        }
                    }
                    break;
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
        } catch (e: any) {
            processError = e.message;
            logger.error(`Error processing webhook event: ${e.message}`, { request_id: requestId }, e);
        }

        // Mark processed
        await supabaseAdmin
            .from('stripe_events')
            .update({
                processed: processError === null,
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
