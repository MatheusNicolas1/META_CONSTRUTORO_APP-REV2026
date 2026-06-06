import { describe, expect, it } from "vitest";
import { isPublicAnalyticsEvent } from "../analytics";

describe("analytics integration", () => {
  it("allows only public funnel events for anonymous Supabase persistence", () => {
    expect(isPublicAnalyticsEvent("app.public_page_viewed")).toBe(true);
    expect(isPublicAnalyticsEvent("marketing.pricing_viewed")).toBe(true);
    expect(isPublicAnalyticsEvent("auth.signup_viewed")).toBe(true);
    expect(isPublicAnalyticsEvent("billing.checkout_viewed")).toBe(true);

    expect(isPublicAnalyticsEvent("app.route_viewed")).toBe(false);
    expect(isPublicAnalyticsEvent("onboarding.started")).toBe(false);
  });
});
