import { describe, expect, it } from "vitest";
import { signWebhookPayload } from "./sign-webhook";

describe("signWebhookPayload", () => {
  it("returns a stable hex signature", async () => {
    const signature = await signWebhookPayload(
      '{"event":"budget.updated"}',
      "super_secret_key",
    );

    expect(signature).toMatch(/^[a-f0-9]+$/);
    expect(signature.length).toBe(64);
  });
});
