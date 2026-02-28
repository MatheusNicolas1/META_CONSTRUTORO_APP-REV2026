
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";
import { createScopedClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createScopedClient(req);

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("User not found");
        }

        // Get current subscription
        const { data: subscriptionData } = await supabaseClient
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", user.id)
            .in("status", ["active", "trialing"])
            .single();

        let subscriptionId = subscriptionData?.stripe_subscription_id;

        if (!subscriptionId) {
            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("stripe_subscription_id")
                .eq("id", user.id)
                .single();
            subscriptionId = profile?.stripe_subscription_id;
        }

        if (!subscriptionId) {
            throw new Error("No active subscription found");
        }

        // Cancel at period end
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

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
