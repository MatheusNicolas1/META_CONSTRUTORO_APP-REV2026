import { describe, expect, it } from "vitest";
import {
  canonicalizeAuthenticatedRoute,
  sanitizeInteractionLabel,
} from "../authenticatedAnalytics";

describe("authenticated analytics helpers", () => {
  it("canonicalizes dynamic ids in authenticated routes", () => {
    expect(canonicalizeAuthenticatedRoute("/app/obras/123e4567-e89b-12d3-a456-426614174000")).toEqual({
      routeName: "obras",
      canonicalPath: "/app/obras/:id",
    });

    expect(canonicalizeAuthenticatedRoute("/app/rdo/123")).toEqual({
      routeName: "rdos",
      canonicalPath: "/app/rdo/:id",
    });
  });

  it("keeps known route names stable", () => {
    expect(canonicalizeAuthenticatedRoute("/app/dashboard").routeName).toBe("dashboard");
    expect(canonicalizeAuthenticatedRoute("/app/admin").routeName).toBe("admin");
  });

  it("redacts interaction labels with PII", () => {
    expect(sanitizeInteractionLabel("Enviar para joao@example.com")).toBe("redacted");
    expect(sanitizeInteractionLabel("(11) 99999-9999")).toBe("redacted");
    expect(sanitizeInteractionLabel("Abrir relatorio")).toBe("Abrir relatorio");
  });
});
