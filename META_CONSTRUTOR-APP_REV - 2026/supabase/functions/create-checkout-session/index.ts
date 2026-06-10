import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createScopedClient } from "../_shared/supabase-client.ts";
import { cleanText, ensureBillingUserFoundation, saveStripeCustomerId } from "../_shared/billing-user-foundation.ts";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient()
});
/**
 * Valida um cupom na tabela `coupons` e retorna os dados de desconto.
 * Retorna null se o cupom for inválido/expirado e lança erro se o código não existir.
 */ async function validateCoupon(supabaseAdmin, code) {
  const { data: coupon, error } = await supabaseAdmin.from("coupons").select("id, code, discount_type, discount_value, discount_percentage, valid_until, usage_limit, times_used, is_active").eq("code", code.toUpperCase().trim()).maybeSingle();
  if (error) throw new Error(`Erro ao buscar cupom: ${error.message}`);
  if (!coupon) throw new Error("Cupom inválido ou não encontrado.");
  if (!coupon.is_active) throw new Error("Este cupom não está mais ativo.");
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) throw new Error("Este cupom expirou.");
  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) throw new Error("Este cupom já atingiu o limite de usos.");
  return coupon;
}
/**
 * Cria ou atualiza um Stripe Coupon a partir dos dados do cupom.
 * Retorna o stripe_coupon_id (ou o código do stripe_coupon_id) para usar no checkout.
 */ async function ensureStripeCoupon(stripe, coupon, resolvedPriceId1) {
  // Se for percentual, usamos o sistema nativo de promoção com allow_promotion_codes
  // Se for fixo, criamos um Stripe Coupon que será aplicado como discount no line_item
  if (coupon.discount_type === "percent") {
    const percent = coupon.discount_value || coupon.discount_percentage || 0;
    // Usar Stripe Coupon para aplicar % diretamente
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (${percent}% OFF)`,
      percent_off: percent,
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code
      }
    });
    return stripeCoupon.id;
  } else if (coupon.discount_type === "fixed") {
    const amountOff = Math.round(Number(coupon.discount_value) * 100); // converter para centavos
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (R$ ${coupon.discount_value} OFF)`,
      amount_off: amountOff,
      currency: "brl",
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code
      }
    });
    return stripeCoupon.id;
  }
  throw new Error("Tipo de desconto inválido");
}
/**
 * Incrementa o contador de uso do cupom no banco de dados.
 */ async function incrementCouponUsage(supabaseAdmin, couponId) {
  const { error } = await supabaseAdmin.rpc("increment_coupon_usage", {
    coupon_id: couponId
  });
  if (error) {
    console.error("Erro ao incrementar uso do cupom:", error);
  }
}
serve(async (req)=>{
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createScopedClient(req);
    const supabaseAdmin = createAdminClient();
    const { data: { user: user1 } } = await supabaseClient.auth.getUser();
    if (!user1) {
      throw new Error("User not found");
    }
    const { priceId, plan: plan1, billing: billing1 = "monthly", successUrl, cancelUrl, profile: checkoutProfile = {}, coupon_code } = await req.json();
    if (!priceId && !plan1) {
      throw new Error("Plan or Price ID is required");
    }
    let resolvedPriceId1 = priceId;
    let planId = null;
    if (!resolvedPriceId1) {
      if (![
        "monthly",
        "yearly"
      ].includes(billing1)) {
        throw new Error("Invalid billing cycle");
      }
      const priceField = billing1 === "monthly" ? "stripe_price_id_monthly" : "stripe_price_id_yearly";
      const monthlyField = "monthly_price_cents";
      const yearlyField = "yearly_price_cents";
      const { data: planData, error: planError } = await supabaseAdmin.from("plans").select(`id, ${priceField}, ${monthlyField}, ${yearlyField}, name`).eq("slug", plan1).eq("is_active", true).single();
      if (planError || !planData) throw new Error(`Plan not found: ${plan1}`);
      resolvedPriceId1 = planData[priceField];
      planId = planData.id;
      // If no Stripe Price ID exists, create one dynamically
      if (!resolvedPriceId1) {
        const amountCents = billing1 === "monthly" ? planData[monthlyField] : planData[yearlyField];
        if (!amountCents || amountCents <= 0) {
          throw new Error(`Invalid price for plan ${plan1}: ${amountCents}`);
        }
        const interval = billing1 === "monthly" ? "month" : "year";
        const newPrice = await stripe.prices.create({
          unit_amount: amountCents,
          currency: "brl",
          recurring: {
            interval
          },
          product_data: {
            name: `${planData.name} (${billing1 === "monthly" ? "Mensal" : "Anual"})`,
            description: `Plano ${planData.name} - ${billing1 === "monthly" ? "Mensal" : "Anual"}`
          },
          metadata: {
            plan_slug: plan1,
            billing: billing1,
            plan_id: planData.id
          }
        });
        resolvedPriceId1 = newPrice.id;
        console.log("Created new Stripe Price ID dynamically:", {
          priceId: newPrice.id,
          plan: plan1,
          billing: billing1,
          amountCents
        });
      }
    }
    if (!resolvedPriceId1) throw new Error("Stripe Price ID not found");
    const { profile, orgMember } = await ensureBillingUserFoundation(supabaseAdmin, user1, checkoutProfile);
    const { data: activeSubscription, error: activeSubscriptionError } = await supabaseAdmin.from("subscriptions").select("stripe_subscription_id, status").eq("org_id", orgMember.org_id).in("status", [
      "active",
      "trialing",
      "past_due"
    ]).order("updated_at", {
      ascending: false
    }).limit(1).maybeSingle();
    if (activeSubscriptionError) throw activeSubscriptionError;
    if (activeSubscription?.stripe_subscription_id) {
      throw new Error("Active subscription already exists. Use /app/planos to change plan.");
    }
    let customerId1 = profile?.stripe_customer_id;
    if (!customerId1) {
      const customer = await stripe.customers.create({
        email: user1.email,
        name: profile?.name || cleanText(checkoutProfile.name) || undefined,
        metadata: {
          user_id: user1.id,
          org_id: orgMember.org_id
        }
      });
      customerId1 = customer.id;
      await saveStripeCustomerId(supabaseAdmin, user1.id, customerId1);
    }
    // --- LÓGICA DE CUPOM ---
    let stripeCouponId = null;
    let appliedCoupon = null;
    if (coupon_code && coupon_code.trim()) {
      appliedCoupon = await validateCoupon(supabaseAdmin, coupon_code);
      // Cria um Stripe Coupon com base no cupom do banco de dados
      stripeCouponId = await ensureStripeCoupon(stripe, appliedCoupon, resolvedPriceId1);
      // Incrementa o contador de uso do cupom
      await incrementCouponUsage(supabaseAdmin, appliedCoupon.id);
    }
    // Criar a sessão de checkout com ou sem cupom
    const sessionConfig = {
      customer: customerId1,
      line_items: [
        {
          price: resolvedPriceId1,
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/checkout/cancel`,
      metadata: {
        user_id: user1.id,
        org_id: orgMember.org_id,
        plan_id: planId || "",
        billing: billing1,
        coupon_code: coupon_code || "",
        coupon_id: appliedCoupon?.id || ""
      },
      allow_promotion_codes: true
    };
    // Se um cupom foi aplicado, adiciona o discount na sessão
    if (stripeCouponId) {
      sessionConfig.discounts = [
        {
          coupon: stripeCouponId
        }
      ];
      // Quando usamos coupon do Stripe, podemos desabilitar allow_promotion_codes
      // para evitar conflito (usuário tentar 2 códigos)
      sessionConfig.allow_promotion_codes = false;
    }
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Checkout session created successfully:", {
      sessionId: session.id,
      url: session.url,
      plan: plan1,
      billing: billing1
    });
    console.log("Session metadata:", sessionConfig.metadata);
    console.log("Customer:", {
      customerId: customerId1,
      email: user1.email
    });
    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url,
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discount_type: appliedCoupon.discount_type,
        discount_value: appliedCoupon.discount_value
      } : null
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Checkout session creation failed:", {
      error: error.message,
      plan,
      billing,
      resolvedPriceId,
      customerId,
      userId: user?.id
    });
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
