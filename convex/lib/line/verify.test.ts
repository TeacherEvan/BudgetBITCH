import { describe, it, expect } from "vitest";
import { verifyLineSignature } from "./verify";
import crypto from "crypto";

describe("verifyLineSignature", () => {
  it("accepts a valid HMAC-SHA256 signature", () => {
    const secret = "testsecret";
    const body = '{"events":[]}';
    const sig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");
    expect(verifyLineSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a wrong signature", () => {
    expect(verifyLineSignature('{"events":[]}', "abc=", "testsecret")).toBe(
      false,
    );
  });

  it("rejects when the body content differs", () => {
    const secret = "testsecret";
    const body = '{"events":[]}';
    const sig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("base64");
    expect(verifyLineSignature('{"events":[1]}', sig, secret)).toBe(false);
  });

  it("rejects a malformed (non-base64) signature without throwing", () => {
    expect(verifyLineSignature('{"events":[]}', "!!!notbase64!!!", "s")).toBe(
      false,
    );
  });
});
