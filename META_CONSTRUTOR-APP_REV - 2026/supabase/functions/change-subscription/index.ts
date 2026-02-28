
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

        const { newPriceId } = await req.json();

        if (!newPriceId) {
            throw new Error("New Price ID is required");
        }

        // Get current subscription
        const { data: subscriptionData } = await supabaseClient
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .single();

        // Fallback to checking profile if not found in subscriptions table
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
