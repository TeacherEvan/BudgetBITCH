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

  test("accepts the TeacherBOY contract where hints are JSON null (Python None)", () => {
    const res = ingestRequestBodySchema.safeParse({
      lineUserId: "U1",
      idempotencyKey: "line_abc",
      payload: {
        lines: [{ text: "Total 150.00 THB", conf: 85, y: 0, words: [] }],
        width: 1024,
        height: 200,
        lang: "en",
        engine: "gemini-vision@1",
        capturedAt: 1_700_000_000,
        countryHint: "TH",
        currencyHint: null,
      },
    });
    expect(res.success).toBe(true);
  });
});
