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
  });
});
