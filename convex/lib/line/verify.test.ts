import { describe, it, expect } from "vitest";
import { verifyLineSignature } from "./verify";
import crypto from "crypto";

describe("verifyLineSignature", () => {
  it("accepts a valid HMAC-SHA256 signature", async () => {
    const secret = "testsecret";
    const body = '{"events":[]}';
    const sig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");
    expect(await verifyLineSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a wrong signature", async () => {
    expect(
      await verifyLineSignature('{"events":[]}', "abc=", "testsecret"),
    ).toBe(false);
  });

  it("rejects when the body content differs", async () => {
    const secret = "testsecret";
    const body = '{"events":[]}';
    const sig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");
    expect(await verifyLineSignature('{"events":[1]}', sig, secret)).toBe(
      false,
    );
  });

  it("rejects a malformed (non-base64) signature without throwing", async () => {
    expect(
      await verifyLineSignature('{"events":[]}', "!!!notbase64!!!", "s"),
    ).toBe(false);
  });
});
