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

        const { returnUrl } = await req.json().catch(() => ({}));

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

        const { data: subscription } = await supabaseAdmin
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("org_id", orgMember.org_id)
            .in("status", ["active", "trialing", "past_due"])
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        let customerId = subscription?.stripe_customer_id;

        if (!customerId) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("stripe_customer_id")
                .eq("id", user.id)
                .maybeSingle();
            customerId = profile?.stripe_customer_id;
        }

        if (!customerId) throw new Error("Stripe customer not found");

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || req.headers.get("origin") || "https://metaconstrutor.com.br/app/perfil",
        });

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
