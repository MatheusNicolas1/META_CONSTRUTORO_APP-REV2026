import { describe, expect, it } from "vitest";
import {
  computeAmountOffCents,
  computePercentOff,
  validateCouponRow,
  type CouponRowLike,
} from "../couponValidation";

const baseCoupon: CouponRowLike = {
  id: "00000000-0000-0000-0000-000000000001",
  code: "DESCONTO10",
  discount_type: "percent",
  discount_value: 10,
  valid_until: null,
  usage_limit: null,
  times_used: 0,
  is_active: true,
};

describe("validateCouponRow", () => {
  it("rejeita cupom inexistente", () => {
    expect(validateCouponRow(null)).toEqual({
      valid: false,
      reason: "Cupom inválido ou não encontrado.",
    });
    expect(validateCouponRow(undefined)).toEqual({
      valid: false,
      reason: "Cupom inválido ou não encontrado.",
    });
  });

  it("rejeita cupom inativo (is_active = false)", () => {
    expect(validateCouponRow({ ...baseCoupon, is_active: false })).toEqual({
      valid: false,
      reason: "Este cupom não está mais ativo.",
    });
  });

  it("rejeita cupom expirado (valid_until no passado)", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    const expired = {
      ...baseCoupon,
      valid_until: new Date("2026-07-31T23:59:59Z"),
    };
    expect(validateCouponRow(expired, now)).toEqual({
      valid: false,
      reason: "Este cupom expirou.",
    });
  });

  it("aceita cupom dentro da validade", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    const future = {
      ...baseCoupon,
      valid_until: new Date("2026-08-02T00:00:00Z"),
    };
    expect(validateCouponRow(future, now)).toEqual({ valid: true, coupon: future });
  });

  it("rejeita cupom que atingiu o limite de usos", () => {
    const maxed = { ...baseCoupon, usage_limit: 5, times_used: 5 };
    expect(validateCouponRow(maxed)).toEqual({
      valid: false,
      reason: "Este cupom já atingiu o limite de usos.",
    });
  });

  it("aceita cupom com usos abaixo do limite", () => {
    const ok = { ...baseCoupon, usage_limit: 5, times_used: 4 };
    expect(validateCouponRow(ok).valid).toBe(true);
  });

  it("ignora limite quando usage_limit é nulo (ilimitado)", () => {
    const unlimited = { ...baseCoupon, usage_limit: null, times_used: 9999 };
    expect(validateCouponRow(unlimited).valid).toBe(true);
  });
});

describe("computePercentOff (arredondamento/clamp do percent_off)", () => {
  it("trunca para no máximo 2 casas decimais", () => {
    expect(computePercentOff(99.999)).toBe(99.99);
    expect(computePercentOff(33.3333)).toBe(33.33);
  });

  it("mantém valores inteiros inalterados", () => {
    expect(computePercentOff(10)).toBe(10);
    expect(computePercentOff(50)).toBe(50);
  });

  it("faz clamp do limite superior em 100", () => {
    expect(computePercentOff(150)).toBe(100);
    expect(computePercentOff(100.5)).toBe(100);
  });

  it("faz clamp do limite inferior em 0", () => {
    expect(computePercentOff(-5)).toBe(0);
  });

  it("trata valores nulos/ausentes como 0", () => {
    expect(computePercentOff(null)).toBe(0);
    expect(computePercentOff(undefined)).toBe(0);
  });

  it("usa discount_percentage legado quando discount_value ausente", () => {
    // Comportamento espelhado: `discount_value || discount_percentage || 0`
    expect(computePercentOff("15")).toBe(15);
  });
});

describe("computeAmountOffCents (cupom fixo)", () => {
  it("converte reais para centavos inteiros", () => {
    expect(computeAmountOffCents(10.5)).toBe(1050);
    expect(computeAmountOffCents(20)).toBe(2000);
  });

  it("arredonda para o centavo inteiro mais próximo", () => {
    expect(computeAmountOffCents(12.34)).toBe(1234);
    expect(computeAmountOffCents(0.5)).toBe(50);
  });
});
