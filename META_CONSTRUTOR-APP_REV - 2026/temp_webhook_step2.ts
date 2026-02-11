// STEP 2: Modified checkout.session.completed handler with price_id mapping

case 'checkout.session.completed': {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id || session.metadata?.user_id
    const orgId = session.metadata?.org_id

    if (!userId || !orgId) {
        console.error('Missing user_id or org_id in checkout session metadata')
        break
    }

    const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
    )

    // M4 STEP 2: Map Stripe price_id to plan_id (do not trust metadata alone)
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) {
        console.error('No price_id found in subscription items')
        break
    }

    // Find plan by matching stripe_price_id_monthly or stripe_price_id_yearly
    const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, slug')
        .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
        .eq('is_active', true)
        .single()

    if (planError || !plan) {
        console.error(`Plan not found for price_id: ${priceId}`, planError)
        break
    }

    console.log(`✓ Mapped price_id ${priceId} → plan ${plan.slug} (${plan.id})`)

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
            billing_cycle: session.metadata?.billing || 'monthly',
        }, { onConflict: 'stripe_subscription_id' })

    if (subError) {
        console.error('Error creating subscription:', subError)
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

    console.log(`✅ Subscription activated for org ${orgId}`)
    break
}
