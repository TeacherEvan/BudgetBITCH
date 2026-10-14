import { describe, expect, test } from "vitest";
import { ingestRequestBodySchema } from "./ingestSchema";

const validPayload = {
  lineUserId: "U123",
  idempotencyKey: "idemp-1",
  payload: {
    lines: [{ text: "Total 150.00 THB", conf: 0.9, y: 10, words: [] }],
    width: 800,
    height: 1200,
    lang: "th",
    engine: "tesseract.js@6",
    capturedAt: 1_700_000_000,
  },
};

describe("ingestRequestBodySchema", () => {
  test("accepts a well-formed receipt payload", () => {
    const res = ingestRequestBodySchema.safeParse(validPayload);
    expect(res.success).toBe(true);
  });

  test("rejects a body missing required top-level fields", () => {
    const res = ingestRequestBodySchema.safeParse({ payload: validPayload.payload });
    expect(res.success).toBe(false);
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("lineUserId");
      expect(paths).toContain("idempotencyKey");
    }
  });

  test("rejects a payload with empty lines array", () => {
    const res = ingestRequestBodySchema.safeParse({
      ...validPayload,
      payload: { ...validPayload.payload, lines: [] },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.join(".") === "payload.lines")).toBe(true);
    }
  });

  test("tolerates optional payload fields being absent", () => {
    const res = ingestRequestBodySchema.safeParse({
      lineUserId: "U1",
      idempotencyKey: "k1",
      payload: { lines: [{ text: "Coffee" }] },
    });
    expect(res.success).toBe(true);
  });
});

// Guards regression for the shipped ingestSchema.ts fix: every optional payload
// hint moved from `.optional()` to `.nullish()`. The bot's adapter
// (`receipt_bridge.gemini_text_to_ocr_payload`) serialises an absent hint as
// JSON `null` rather than omitting the key — `"currencyHint": None` ships on
// every scan — so `.optional()` 400'd every bot receipt in production while the
// hand-written fixtures above, which omit the key, stayed green.
describe("ingestRequestBodySchema accepts Python-style null hints", () => {
  test("accepts currencyHint: null", () => {
    const res = ingestRequestBodySchema.safeParse({
      ...validPayload,
      payload: { ...validPayload.payload, currencyHint: null },
    });
    expect(res.success).toBe(true);
  });

  test("accepts every payload-level hint as null", () => {
    const res = ingestRequestBodySchema.safeParse({
      lineUserId: "U123",
      idempotencyKey: "idemp-null",
      payload: {
        lines: [{ text: "TOTAL 91000" }],
        width: null,
        height: null,
        lang: null,
        engine: null,
        capturedAt: null,
        countryHint: null,
        currencyHint: null,
      },
    });
    expect(res.success).toBe(true);
  });

  test("accepts conf, y and words as null inside payload.lines", () => {
    const res = ingestRequestBodySchema.safeParse({
      lineUserId: "U123",
      idempotencyKey: "idemp-null-lines",
      payload: {
        lines: [{ text: "TOTAL 28,000", conf: null, y: null, words: null }],
        currencyHint: null,
      },
    });
    expect(res.success).toBe(true);
  });

  test("still rejects a wrong-typed hint rather than accepting anything", () => {
    const res = ingestRequestBodySchema.safeParse({
      ...validPayload,
      payload: { ...validPayload.payload, currencyHint: 42 },
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.join(".") === "payload.currencyHint")).toBe(true);
    }
  });

  test("still rejects a null text field, which the scraper cannot read", () => {
    const res = ingestRequestBodySchema.safeParse({
      lineUserId: "U123",
      idempotencyKey: "idemp-null-text",
      payload: { lines: [{ text: null, conf: null }] },
    });
    expect(res.success).toBe(false);
  });
});
