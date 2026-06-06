
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createScopedClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const getBillingOrgMember = async (supabaseAdmin: any, userId: string) => {
    const { data, error } = await supabaseAdmin
        .from("org_members")
        .select("org_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .in("role", ["Presidente", "Administrador"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
};

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createScopedClient(req);
        const supabaseAdmin = createAdminClient();

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("User not found");
        }

        const { newPriceId: rawPriceId, plan, billing = "monthly" } = await req.json();

        if (!rawPriceId && !plan) {
            throw new Error("Plan or new Price ID is required");
        }

        const orgMember = await getBillingOrgMember(supabaseAdmin, user.id);

        if (!orgMember?.org_id) throw new Error("Organization not found for user");

        let newPriceId = rawPriceId;
        let nextPlanId: string | null = null;
        let nextPlanSlug: string | null = null;

        if (plan) {
            if (!["monthly", "yearly"].includes(billing)) {
                throw new Error("Invalid billing cycle");
            }

            const priceField = billing === "yearly" ? "stripe_price_id_yearly" : "stripe_price_id_monthly";
            const { data: planData, error: planError } = await supabaseAdmin
                .from("plans")
                .select(`id, slug, ${priceField}`)
                .eq("slug", plan)
                .eq("is_active", true)
                .single();

            if (planError || !planData) throw new Error(`Plan not found: ${plan}`);
            newPriceId = planData[priceField as keyof typeof planData] as string;
            nextPlanId = planData.id;
            nextPlanSlug = planData.slug;
        }

        if (!newPriceId) {
            throw new Error(`Price ID missing for ${plan || "selected plan"} (${billing})`);
        }

        // Get current subscription
        const { data: subscriptionData } = await supabaseAdmin
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("org_id", orgMember.org_id)
            .in("status", ["active", "trialing", "past_due"])
            .maybeSingle();

        // Fallback to checking profile if not found in subscriptions table
        let subscriptionId = subscriptionData?.stripe_subscription_id;

        if (!subscriptionId) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("stripe_subscription_id")
                .eq("id", user.id)
                .maybeSingle();
            subscriptionId = profile?.stripe_subscription_id;
        }

        if (!subscriptionId) {
            throw new Error("No active subscription found");
        }

        // Retrieve subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Check if it is an upgrade or downgrade logic could go here, 
        // but for now we apply standard proration behavior.

        const items = [{
            id: subscription.items.data[0].id,
            price: newPriceId,
        }];

        // Update subscription
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: items,
            proration_behavior: 'create_prorations',
            payment_behavior: 'pending_if_incomplete',
            metadata: {
                user_id: user.id,
                org_id: orgMember.org_id,
                plan_slug: nextPlanSlug || "",
                billing_cycle: billing,
            },
            expand: ['latest_invoice.payment_intent'],
        });

        if (nextPlanId) {
            await supabaseAdmin
                .from("subscriptions")
                .update({
                    plan_id: nextPlanId,
                    billing_cycle: billing,
                    stripe_price_id: newPriceId,
                    status: updatedSubscription.status,
                })
                .eq("stripe_subscription_id", subscriptionId);

            await supabaseAdmin
                .from("profiles")
                .update({
                    plan_type: nextPlanSlug,
                    subscription_status: updatedSubscription.status,
                    stripe_subscription_id: subscriptionId,
                })
                .eq("id", user.id);
        }

        return new Response(JSON.stringify({ subscription: updatedSubscription }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
