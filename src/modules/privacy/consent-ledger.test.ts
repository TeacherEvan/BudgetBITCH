import { describe, expect, it } from "vitest";
import { buildConsentReceipt } from "./consent-ledger";

describe("buildConsentReceipt", () => {
  it("creates a timestamped consent receipt payload", () => {
    const result = buildConsentReceipt({
      workspaceId: "ws_1",
      provider: "claude",
      disclosureVersion: "2026-04-06",
      disclosures: [
        "Only explicitly connected providers receive the minimum required data.",
      ],
    });

    expect(result).toMatchObject({
      workspaceId: "ws_1",
      provider: "claude",
      disclosureVersion: "2026-04-06",
      disclosuresJson: {
        items: [
          "Only explicitly connected providers receive the minimum required data.",
        ],
      },
    });
    expect(result.acceptedAt).toBeInstanceOf(Date);
  });
});
