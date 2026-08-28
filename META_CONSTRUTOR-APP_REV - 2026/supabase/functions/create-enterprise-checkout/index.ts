import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// --- Funções de validação e aplicação de cupom ---

/**
 * Valida um cupom na tabela `coupons` e retorna os dados de desconto.
 * Lança erro se o cupom for inválido/expirado.
 */
async function validateCoupon(supabaseAdmin: any, code: string) {
  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("id, code, discount_type, discount_value, discount_percentage, valid_until, usage_limit, times_used, is_active")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar cupom: ${error.message}`);
  if (!coupon) throw new Error("Cupom inválido ou não encontrado.");
  if (!coupon.is_active) throw new Error("Este cupom não está mais ativo.");
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) throw new Error("Este cupom expirou.");
  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) throw new Error("Este cupom já atingiu o limite de usos.");

  return coupon;
}

/**
 * Cria um Stripe Coupon a partir dos dados do cupom do banco.
 * Retorna o ID do Stripe Coupon.
 */
async function ensureStripeCoupon(stripe: any, coupon: any) {
  if (coupon.discount_type === "percent") {
    const percent = Math.min(100, Math.max(0, Math.floor((Number(coupon.discount_value || coupon.discount_percentage || 0)) * 100) / 100));
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (${percent}% OFF)`,
      percent_off: percent,
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code,
      },
    });
    return stripeCoupon.id;
  } else if (coupon.discount_type === "fixed") {
    const amountOff = Math.round(Number(coupon.discount_value) * 100);
    const stripeCoupon = await stripe.coupons.create({
      name: `Cupom ${coupon.code} (R$ ${coupon.discount_value} OFF)`,
      amount_off: amountOff,
      currency: "brl",
      duration: "once",
      max_redemptions: 1,
      metadata: {
        coupon_id: coupon.id,
        coupon_code: coupon.code,
      },
    });
    return stripeCoupon.id;
  }
  throw new Error("Tipo de desconto inválido");
}

/**
 * Incrementa o contador de uso do cupom no banco.
 */
async function incrementCouponUsage(supabaseAdmin: any, couponId: string) {
  const { error } = await supabaseAdmin.rpc("increment_coupon_usage", {
    coupon_id: couponId,
  });
  if (error) {
    console.error("Erro ao incrementar uso do cupom:", error);
  }
}

interface EnterpriseCheckoutRequest {
  /** ID do plano enterprise_custom_plans (se já existir) */
  plan_id?: string;
  /** OU: nome+slug+preço para criar na hora (modo rápido) */
  name?: string;
  slug?: string;
  monthly_price_cents: number;
  yearly_price_cents?: number;
  /** Nome da organização/cliente */
  org_name?: string;
  org_id?: string;
  /** Funções customizadas */
  custom_features?: string[];
  max_users?: number;
  /** Cupom opcional */
  coupon_code?: string;
  /** success_url e cancel_url opcionais */
  success_url?: string;
  cancel_url?: string;
  /** Locale opcional para o Stripe Checkout */
  locale?: string;
}

serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    // 1. Autenticação: apenas admin presidente via service_role
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAdmin = createAdminClient(authHeader);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    // 2. Verificar role global do usuário === 'presidente'
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("global_role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.global_role !== "presidente") {
      return new Response(
        JSON.stringify({ error: "Apenas presidente pode criar checkouts Enterprise" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    const body: EnterpriseCheckoutRequest = await req.json();

    if (!body.monthly_price_cents || body.monthly_price_cents < 0) {
      return new Response(
        JSON.stringify({ error: "monthly_price_cents é obrigatório" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    // 3. Se veio plan_id, buscar do banco
    let planName: string;
    let planSlug: string;
    let dbPlanId: string | null = null;
    let featuresList: string[] = body.custom_features || [
      "Tudo do plano Master",
      "White label (sua marca)",
      "Single Sign-On (SSO)",
      "SLA garantido 99.9%",
      "Treinamento dedicado da equipe",
      "On-premise disponível",
      "Contrato personalizado",
    ];

    if (body.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("enterprise_custom_plans")
        .select("*")
        .eq("id", body.plan_id)
        .single();

      if (!plan) {
        return new Response(
          JSON.stringify({ error: "Plano Enterprise não encontrado" }),
          { status: 404, headers: { ...headers, "Content-Type": "application/json" } },
        );
      }

      planName = plan.name;
      planSlug = plan.slug;
      dbPlanId = plan.id;
      featuresList = body.custom_features?.length ? body.custom_features : plan.custom_features;
      
      // Usar o preço do plano se não foi passado
      body.monthly_price_cents = body.monthly_price_cents || plan.monthly_price_cents;
      body.yearly_price_cents = body.yearly_price_cents || plan.yearly_price_cents;
      body.max_users = body.max_users || plan.max_users;
    } else {
      // Modo rápido: criar plano no banco
      planName = body.name || `Enterprise - ${body.org_name || "Cliente"}`;
      planSlug = body.slug || `enterprise-${Date.now()}`;

      const { data: newPlan, error: insertError } = await supabaseAdmin
        .from("enterprise_custom_plans")
        .insert({
          name: planName,
          slug: planSlug,
          description: `Plano Enterprise customizado - ${planName}`,
          org_id: body.org_id || null,
          monthly_price_cents: body.monthly_price_cents,
          yearly_price_cents: body.yearly_price_cents || null,
          custom_features: featuresList,
          max_users: body.max_users || null,
          status: 'negotiating',
          created_by: user.id,
          metadata: {
            created_via: 'create-enterprise-checkout',
            org_name: body.org_name || null,
          },
        })
        .select("id")
        .single();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: `Erro ao criar plano: ${insertError.message}` }),
          { status: 500, headers: { ...headers, "Content-Type": "application/json" } },
        );
      }
      dbPlanId = newPlan.id;

      // Registrar auditoria
      await supabaseAdmin.from("enterprise_plan_audit_log").insert({
        plan_id: dbPlanId,
        action: 'created',
        changed_by: user.id,
        new_values: {
          name: planName,
          slug: planSlug,
          monthly_price_cents: body.monthly_price_cents,
          yearly_price_cents: body.yearly_price_cents,
          status: 'negotiating',
        },
        notes: 'Criado via create-enterprise-checkout',
      });
    }

    // 4. Criar Stripe Product (sempre criar um novo para não reutilizar prices)
    const stripeProduct = await stripe.products.create({
      name: `Enterprise - ${planName}`,
      description: `Plano Enterprise customizado - R$ ${(body.monthly_price_cents / 100).toFixed(2)}/mês\nFeatures: ${featuresList.join(", ")}`,
      metadata: {
        enterprise_plan_id: dbPlanId,
        type: 'enterprise_custom',
        max_users: String(body.max_users || ''),
      },
    });

    // 5. Criar Stripe Price mensal
    const stripePriceMonthly = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: body.monthly_price_cents,
      currency: "brl",
      recurring: { interval: "month" },
      metadata: {
        enterprise_plan_id: dbPlanId,
        type: 'enterprise_custom',
      },
    });

    // 6. Criar Stripe Price anual (se fornecido)
    let stripePriceYearly = null;
    if (body.yearly_price_cents) {
      stripePriceYearly = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: body.yearly_price_cents,
        currency: "brl",
        recurring: { interval: "year" },
        metadata: {
          enterprise_plan_id: dbPlanId,
          type: 'enterprise_custom',
        },
      });
    }

    // 7. Atualizar plano no banco com os IDs Stripe
    await supabaseAdmin
      .from("enterprise_custom_plans")
      .update({
        stripe_product_id: stripeProduct.id,
        stripe_price_id_monthly: stripePriceMonthly.id,
        stripe_price_id_yearly: stripePriceYearly?.id || null,
        status: 'active',
      })
      .eq("id", dbPlanId);

    await supabaseAdmin.from("enterprise_plan_audit_log").insert({
      plan_id: dbPlanId,
      action: 'stripe_linked',
      changed_by: user.id,
      new_values: {
        stripe_product_id: stripeProduct.id,
        stripe_price_id_monthly: stripePriceMonthly.id,
        stripe_price_id_yearly: stripePriceYearly?.id || null,
      },
    });

    // 8. Aplicar cupom (se fornecido)
    let appliedCoupon = null;
    let stripeCouponId = null;

    if (body.coupon_code && body.coupon_code.trim()) {
      appliedCoupon = await validateCoupon(supabaseAdmin, body.coupon_code);
      stripeCouponId = await ensureStripeCoupon(stripe, appliedCoupon);
      await incrementCouponUsage(supabaseAdmin, appliedCoupon.id);
    }

    // 9. Criar Stripe Checkout Session
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: stripePriceMonthly.id,
        quantity: 1,
      },
    ];

    const sessionConfig: any = {
      mode: "subscription",
      line_items: lineItems,
      locale: body.locale || 'auto',
      success_url: body.success_url || "https://www.metaconstrutor.app.br/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}&plan=enterprise",
      cancel_url: body.cancel_url || "https://www.metaconstrutor.app.br/preco",
      metadata: {
        enterprise_plan_id: dbPlanId,
        plan_type: 'enterprise_custom',
        plan_name: planName,
        org_name: body.org_name || '',
        max_users: String(body.max_users || ''),
        coupon_code: body.coupon_code || '',
        coupon_id: appliedCoupon?.id || '',
      },
      allow_promotion_codes: true,
    };

    // Se um cupom foi aplicado, adiciona o discount na sessão
    if (stripeCouponId) {
      sessionConfig.discounts = [{ coupon: stripeCouponId }];
      sessionConfig.allow_promotion_codes = false;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // 10. Registrar no log de auditoria
    await supabaseAdmin.from("enterprise_plan_audit_log").insert({
      plan_id: dbPlanId,
      action: 'checkout_created',
      changed_by: user.id,
      new_values: {
        checkout_session_id: session.id,
        checkout_url: session.url,
        price_monthly_cents: body.monthly_price_cents,
        price_yearly_cents: body.yearly_price_cents,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: dbPlanId,
        checkout_url: session.url,
        session_id: session.id,
        stripe_product_id: stripeProduct.id,
        stripe_price_id_monthly: stripePriceMonthly.id,
        stripe_price_id_yearly: stripePriceYearly?.id || null,
        plan_name: planName,
        plan_slug: planSlug,
        monthly_price: body.monthly_price_cents / 100,
        yearly_price: body.yearly_price_cents ? body.yearly_price_cents / 100 : null,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discount_type: appliedCoupon.discount_type,
          discount_value: appliedCoupon.discount_value,
        } : null,
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Enterprise checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } },
    );
  }
});
