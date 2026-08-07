import { describe, expect, it } from "vitest";
import { getCheckoutErrorFeedback } from "../checkoutErrors";

describe("getCheckoutErrorFeedback", () => {
  it("redirects active subscriptions to plan management", () => {
    expect(getCheckoutErrorFeedback(new Error("Active subscription already exists. Use /app/planos to change plan."))).toEqual({
      title: "Assinatura ativa encontrada",
      description: "Use a area de planos para trocar de plano ou ciclo de cobranca.",
      redirect: "plan-management",
    });
  });

  it("hides technical Stripe errors behind a safe payment message", () => {
    expect(getCheckoutErrorFeedback(new Error("Stripe Price ID not found"))).toMatchObject({
      title: "Plano indisponivel",
      variant: "destructive",
    });
  });

  it("returns an actionable email-confirmation message", () => {
    expect(getCheckoutErrorFeedback(new Error("Conta criada. Confirme seu e-mail e faca login para continuar o pagamento."))).toEqual({
      title: "Confirme seu e-mail",
      description: "Sua conta foi criada. Confirme o e-mail e faca login para continuar o pagamento.",
      variant: "destructive",
    });
  });

  it("returns a safe fallback for unknown errors", () => {
    expect(getCheckoutErrorFeedback(new Error("database exploded with internal details"))).toEqual({
      title: "Nao foi possivel continuar",
      description: "Revise os dados informados e tente novamente. Se o problema persistir, fale com o suporte.",
      variant: "destructive",
    });
  });

  it("maps an invalid coupon to a specific message", () => {
    expect(getCheckoutErrorFeedback(new Error("Cupom inválido ou não encontrado."))).toEqual({
      title: "Cupom invalido",
      description: "O cupom informado nao foi reconhecido. Confira o codigo ou remova-o e continue sem desconto.",
      variant: "destructive",
    });
  });

  it("maps an expired coupon to a specific message", () => {
    expect(getCheckoutErrorFeedback(new Error("Este cupom expirou."))).toMatchObject({
      title: "Cupom expirado",
      variant: "destructive",
    });
  });

  it("maps a maxed-out coupon to a specific message", () => {
    expect(getCheckoutErrorFeedback(new Error("Este cupom já atingiu o limite de usos."))).toMatchObject({
      title: "Cupom esgotado",
      variant: "destructive",
    });
  });

  it("maps a deactivated coupon to a specific message", () => {
    expect(getCheckoutErrorFeedback(new Error("Este cupom não está mais ativo."))).toMatchObject({
      title: "Cupom inativo",
      variant: "destructive",
    });
  });
});
