
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createScopedClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

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

        const { priceId, plan, billing = "monthly", successUrl, cancelUrl } = await req.json();

        if (!priceId && !plan) {
            throw new Error("Plan or Price ID is required");
        }

        let resolvedPriceId = priceId;
        let planId: string | null = null;

        if (!resolvedPriceId) {
            if (!["monthly", "yearly"].includes(billing)) {
                throw new Error("Invalid billing cycle");
            }

            const priceField = billing === "monthly" ? "stripe_price_id_monthly" : "stripe_price_id_yearly";
            const { data: planData, error: planError } = await supabaseAdmin
                .from("plans")
                .select(`id, ${priceField}`)
                .eq("slug", plan)
                .eq("is_active", true)
                .single();

            if (planError || !planData) throw new Error(`Plan not found: ${plan}`);
            resolvedPriceId = planData[priceField as keyof typeof planData] as string;
            planId = planData.id;
        } else {
            const { data: planData } = await supabaseAdmin
                .from("plans")
                .select("id")
                .or(`stripe_price_id_monthly.eq.${resolvedPriceId},stripe_price_id_yearly.eq.${resolvedPriceId}`)
                .eq("is_active", true)
                .maybeSingle();
            planId = planData?.id ?? null;
        }

        if (!resolvedPriceId) throw new Error("Stripe Price ID not found");

        const { data: orgMember } = await supabaseAdmin
            .from("org_members")
            .select("org_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .in("role", ["Presidente", "Administrador"])
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (!orgMember?.org_id) throw new Error("Organization not found for user");

        // Get profile to find existing Stripe Customer ID
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_customer_id, email, name")
            .eq("id", user.id)
            .maybeSingle();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            // Create new customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: profile?.name,
                metadata: {
                    user_id: user.id,
                    org_id: orgMember.org_id,
                },
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabaseAdmin
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: resolvedPriceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: successUrl || `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.get("origin")}/checkout/cancel`,
            metadata: {
                user_id: user.id,
                org_id: orgMember.org_id,
                plan_id: planId || "",
                billing,
            },
            allow_promotion_codes: true,
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
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
