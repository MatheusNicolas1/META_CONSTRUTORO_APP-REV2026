/**
 * Lógica pura de validação e normalização de cupons.
 *
 * Espelha EXATAMENTE o comportamento das Edge Functions (Deno):
 *   - supabase/functions/create-checkout-session/index.ts
 *   - supabase/functions/create-enterprise-checkout/index.ts
 *   - supabase/functions/create-subscription/index.ts
 *   - supabase/functions/change-subscription/index.ts
 *
 * Mantida em `src/` para permitir cobertura de testes unitários (Vitest) da
 * mesma lógica que roda no backend, sem depender do runtime Deno.
 */

export type CouponRowLike = {
  id?: string;
  code?: string;
  discount_type?: "percent" | "fixed" | string | null;
  discount_value?: number | string | null;
  discount_percentage?: number | string | null;
  valid_until?: string | Date | null;
  usage_limit?: number | null;
  times_used?: number | null;
  is_active?: boolean | null;
};

export type CouponValidationResult =
  | { valid: true; coupon: CouponRowLike }
  | { valid: false; reason: string };

/**
 * Espelha `validateCoupon()` das Edge Functions.
 *
 * Ordem de checagem (idêntica ao backend):
 *   1. cupom inexistente
 *   2. is_active === false
 *   3. valid_until no passado
 *   4. usage_limit atingido (times_used >= usage_limit)
 */
export function validateCouponRow(
  coupon: CouponRowLike | null | undefined,
  now: Date = new Date(),
): CouponValidationResult {
  if (!coupon) {
    return { valid: false, reason: "Cupom inválido ou não encontrado." };
  }
  if (!coupon.is_active) {
    return { valid: false, reason: "Este cupom não está mais ativo." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, reason: "Este cupom expirou." };
  }
  if (
    coupon.usage_limit != null &&
    (coupon.times_used ?? 0) >= coupon.usage_limit
  ) {
    return { valid: false, reason: "Este cupom já atingiu o limite de usos." };
  }
  return { valid: true, coupon };
}

/**
 * Espelha o cálculo de `percent_off` de `ensureStripeCoupon()`.
 *
 * Stripe exige: 0..100 e no MÁXIMO 2 casas decimais.
 * O backend usa `Math.min(100, Math.max(0, Math.floor(value * 100) / 100))`.
 *
 * ⚠️ Nota de auditoria: `Math.floor` TRUNCA (não arredonda). Para valores
 * fracionários como 0.29 → `0.29 * 100 === 28.999999999999996` → 0.28.
 * Isso NÃO viola o contrato do Stripe (≤2 casas, dentro de 0..100), mas é um
 * truncamento, não um arredondamento — ver relatório de auditoria.
 */
export function computePercentOff(value: number | string | null | undefined): number {
  const raw = Number(value ?? 0);
  return Math.min(100, Math.max(0, Math.floor(raw * 100) / 100));
}

/**
 * Espelha o cálculo de `amount_off` (cupom fixo) de `ensureStripeCoupon()`:
 * valor em reais → centavos inteiros via `Math.round(value * 100)`.
 */
export function computeAmountOffCents(value: number | string | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}
