import { describe, expect, it } from "vitest";
import { containsAnalyticsPii, sanitizeAnalyticsProperties } from "../analyticsPrivacy";

describe("analytics privacy", () => {
  it("redacts direct PII patterns from analytics properties", () => {
    const sanitized = sanitizeAnalyticsProperties({
      label: "Contato joao@example.com",
      cpf_value: "123.456.789-00",
      phone_text: "(11) 99999-9999",
      route: "/app/dashboard",
    });

    expect(sanitized).toEqual({
      label: "[redacted]",
      cpf_value: "[redacted]",
      phone_text: "[redacted]",
      route: "/app/dashboard",
    });
  });

  it("redacts nested sensitive keys before persistence", () => {
    const sanitized = sanitizeAnalyticsProperties({
      profile: {
        name: "Maria Silva",
        email: "maria@empresa.com",
        role: "owner",
      },
      properties: ["ok", "Financeiro 11999999999"],
    });

    expect(sanitized).toEqual({
      profile: {
        name: "[redacted]",
        email: "[redacted]",
        role: "owner",
      },
      properties: ["ok", "[redacted]"],
    });
  });

  it("does not classify ids, routes, dates or campaign names as PII", () => {
    expect(containsAnalyticsPii("2026-05-31T10:00:00.000Z")).toBe(false);
    expect(containsAnalyticsPii("/app/rdos/123e4567-e89b-12d3-a456-426614174000")).toBe(false);
    expect(containsAnalyticsPii("campanha-meta-construtor-maio")).toBe(false);
  });
});
