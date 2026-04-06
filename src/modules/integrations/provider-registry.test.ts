import { describe, expect, it } from "vitest";
import { providerRegistry } from "./provider-registry";

describe("providerRegistry", () => {
  it("contains the supported providers with official URLs and risk metadata", () => {
    expect(providerRegistry.claude.officialLoginUrl).toContain(
      "platform.claude.com",
    );
    expect(providerRegistry.openai.officialLoginUrl).toContain(
      "platform.openai.com",
    );
    expect(providerRegistry.copilot.officialLoginUrl).toContain("github.com");
    expect(providerRegistry.openclaw.officialDocsUrl).toContain("openclaw.ai");
    expect(providerRegistry.openclaw.riskLevel).toBe("high");
    expect(providerRegistry.plaid.label).toBe("Plaid");
    expect(providerRegistry.vanguard.label).toBe("Vanguard");
    expect(providerRegistry.vanguard.category).toBe("investing");
    expect(providerRegistry.stripe.label).toBe("Stripe");
    expect(providerRegistry.ramp.label).toBe("Ramp");
    expect(providerRegistry.gusto.label).toBe("Gusto");
  });
});
