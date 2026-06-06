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

        const { returnUrl, plan, billing = "monthly" } = await req.json().catch(() => ({}));

        const orgMember = await getBillingOrgMember(supabaseAdmin, user.id);

        if (!orgMember?.org_id) throw new Error("Organization not found for user");

        const { data: subscriptionData } = await supabaseAdmin
            .from("subscriptions")
            .select("stripe_customer_id, stripe_subscription_id")
            .eq("org_id", orgMember.org_id)
            .in("status", ["active", "trialing", "past_due"])
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        let customerId = subscriptionData?.stripe_customer_id;

        if (!customerId) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("stripe_customer_id")
                .eq("id", user.id)
                .maybeSingle();
            customerId = profile?.stripe_customer_id;
        }

        if (!customerId) throw new Error("Stripe customer not found");

        const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
            customer: customerId,
            return_url: returnUrl || req.headers.get("origin") || "https://metaconstrutor.com.br/app/perfil",
        };
        const portalConfiguration = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID");
        if (portalConfiguration) {
            sessionParams.configuration = portalConfiguration;
        }

        if (plan) {
            const { data: planData, error: planError } = await supabaseAdmin
                .from("plans")
                .select("slug, stripe_price_id_monthly, stripe_price_id_yearly")
                .eq("slug", plan)
                .eq("is_active", true)
                .single();

            if (planError || !planData) throw new Error(`Plan not found: ${plan}`);
            if (!subscriptionData?.stripe_subscription_id) throw new Error("No active subscription found");

            if (planData.slug === "free") {
                sessionParams.flow_data = {
                    type: "subscription_cancel",
                    subscription_cancel: {
                        subscription: subscriptionData.stripe_subscription_id,
                    },
                    after_completion: {
                        type: "redirect",
                        redirect: {
                            return_url: returnUrl || req.headers.get("origin") || "https://metaconstrutor.com.br/app/planos",
                        },
                    },
                };
            } else {
                if (!["monthly", "yearly"].includes(billing)) {
                    throw new Error("Invalid billing cycle");
                }

                const newPriceId = billing === "yearly"
                    ? planData.stripe_price_id_yearly
                    : planData.stripe_price_id_monthly;

                if (!newPriceId) throw new Error(`Price ID missing for ${plan} (${billing})`);

                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
                const subscriptionItemId = stripeSubscription.items.data[0]?.id;
                if (!subscriptionItemId) throw new Error("Subscription item not found");

                sessionParams.flow_data = {
                    type: "subscription_update_confirm",
                    subscription_update_confirm: {
                        subscription: stripeSubscription.id,
                        items: [
                            {
                                id: subscriptionItemId,
                                price: newPriceId,
                                quantity: 1,
                            },
                        ],
                    },
                    after_completion: {
                        type: "redirect",
                        redirect: {
                            return_url: returnUrl || req.headers.get("origin") || "https://metaconstrutor.com.br/app/planos",
                        },
                    },
                };
            }
        }

        const portalSession = await stripe.billingPortal.sessions.create(sessionParams);

        return new Response(JSON.stringify({ url: portalSession.url }), {
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
