import { describe, expect, it } from "vitest";
import {
  getAdminRiskLabel,
  getAdminRiskPriority,
  getAdminRiskReason,
  getAdminRiskSuggestedAction,
  getAdminRiskTone,
  type AdminRiskListItem,
} from "../adminRiskUtils";

describe("admin risk list helpers", () => {
  it("labels risk levels with operational language", () => {
    expect(getAdminRiskLabel("high")).toBe("Alto risco");
    expect(getAdminRiskLabel("medium")).toBe("Risco medio");
    expect(getAdminRiskLabel("low")).toBe("Baixo risco");
    expect(getAdminRiskLabel("none")).toBe("Sem risco");
  });

  it("explains the risk reason from the activity segment", () => {
    expect(getAdminRiskReason({ activity_segment: "no_activity" })).toBe("Cadastro sem atividade registrada");
    expect(getAdminRiskReason({ activity_segment: "inactive" })).toBe("Sem evento nos ultimos 30 dias");
    expect(getAdminRiskReason({ last_event_at: null })).toBe("Sem ultimo uso registrado");
  });

  it("suggests an action based on risk level", () => {
    const high: AdminRiskListItem = { user_id: "user-1", risk_level: "high" };
    const medium: AdminRiskListItem = { user_id: "user-2", risk_level: "medium" };
    const low: AdminRiskListItem = { user_id: "user-3", risk_level: "low" };

    expect(getAdminRiskSuggestedAction(high)).toBe("Acionar onboarding/suporte");
    expect(getAdminRiskSuggestedAction(medium)).toBe("Enviar follow-up comercial");
    expect(getAdminRiskSuggestedAction(low)).toBe("Monitorar no proximo ciclo");
  });

  it("maps risk tone to badge variants", () => {
    expect(getAdminRiskTone("high")).toBe("destructive");
    expect(getAdminRiskTone("medium")).toBe("secondary");
    expect(getAdminRiskTone("low")).toBe("outline");
  });

  it("prioritizes high risk before medium and low", () => {
    expect(getAdminRiskPriority("high")).toBeLessThan(getAdminRiskPriority("medium"));
    expect(getAdminRiskPriority("medium")).toBeLessThan(getAdminRiskPriority("low"));
  });
});
