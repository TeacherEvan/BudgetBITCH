/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const BOT_SECRET = "test-bot-link-secret";
const CHALLENGE_PATH = "/api/line/link-challenge";

const newTest = () => convexTest(schema, modules);

async function challengeRows(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx: any) =>
    (await ctx.db.query("processedWebhooks").collect()).filter((row: any) =>
      String(row.webhookEventId).startsWith("linkchallenge:"),
    ),
  );
}

describe("POST /api/line/link-challenge (W7)", () => {
  beforeEach(() => {
    // Fail closed unless a test explicitly stubs the secret.
    delete process.env.LINE_BOT_LINK_SECRET;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the x-bot-secret header is missing or wrong", async () => {
    vi.stubEnv("LINE_BOT_LINK_SECRET", BOT_SECRET);
    const body = JSON.stringify({ lineUserId: "U-no-secret" });

    const missing = await newTest().fetch(CHALLENGE_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    expect(missing.status).toBe(401);

    const wrong = await newTest().fetch(CHALLENGE_PATH, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bot-secret": "not-the-secret",
      },
      body,
    });
    expect(wrong.status).toBe(401);

    for (const t of [newTest(), newTest()]) {
      expect(await challengeRows(t)).toHaveLength(0);
    }
  });

  it("returns 503 (fail closed) when LINE_BOT_LINK_SECRET is unset", async () => {
    const t = newTest();
    const res = await t.fetch(CHALLENGE_PATH, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bot-secret": BOT_SECRET,
      },
      body: JSON.stringify({ lineUserId: "U-no-env" }),
    });
    expect(res.status).toBe(503);
    expect(await challengeRows(t)).toHaveLength(0);
  });

  it("returns 400 for malformed JSON or a missing/empty/non-string lineUserId", async () => {
    vi.stubEnv("LINE_BOT_LINK_SECRET", BOT_SECRET);
    const t = newTest();
    const headers = {
      "content-type": "application/json",
      "x-bot-secret": BOT_SECRET,
    };

    const badJson = await t.fetch(CHALLENGE_PATH, {
      method: "POST",
      headers,
      body: "{not json",
    });
    expect(badJson.status).toBe(400);

    for (const payload of [
      {},
      { lineUserId: "" },
      { lineUserId: "   " },
      { lineUserId: 42 },
      { lineUserId: null },
      null,
    ]) {
      const res = await t.fetch(CHALLENGE_PATH, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      expect(res.status).toBe(400);
    }

    expect(await challengeRows(t)).toHaveLength(0);
  });

  it("returns the issued challenge from issueLineLinkChallenge and persists it", async () => {
    vi.stubEnv("LINE_BOT_LINK_SECRET", BOT_SECRET);
    const t = newTest();

    const res = await t.fetch(CHALLENGE_PATH, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bot-secret": BOT_SECRET,
      },
      body: JSON.stringify({ lineUserId: "U-valid" }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.lineUserId).toBe("U-valid");
    expect(body.code).toMatch(/^[0-9a-f]{24}$/);
    expect(body.expiresAt).toBeGreaterThan(Date.now());
    expect(body.expiresAt - Date.now()).toBeLessThanOrEqual(10 * 60 * 1000);
    // The shared bot secret must never leak into the response body.
    expect(JSON.stringify(body)).not.toContain(BOT_SECRET);

    const rows = await challengeRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].webhookEventId).toMatch(/^linkchallenge:U-valid:/);
    expect(rows[0].webhookEventId).not.toContain(body.code);

    // The code returned by the endpoint is a real single-use challenge.
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "w7-endpoint@example.com" }),
    );
    await t.withIdentity({ subject: userId }).mutation(api.line.linkLineAccount, {
      lineUserId: "U-valid",
      code: body.code,
    });
    const mapping = await t.query(internal.line.getConvexUserByLineId, {
      lineUserId: "U-valid",
    });
    expect(mapping).toBe(userId);
  });

  it("replaces an earlier outstanding challenge for the same LINE user id", async () => {
    vi.stubEnv("LINE_BOT_LINK_SECRET", BOT_SECRET);
    const t = newTest();
    const request = () =>
      t.fetch(CHALLENGE_PATH, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-bot-secret": BOT_SECRET,
        },
        body: JSON.stringify({ lineUserId: "U-reissue" }),
      });

    const first = await request();
    expect(first.status).toBe(200);
    const firstBody = await first.json();

    const second = await request();
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.code).not.toBe(firstBody.code);

    expect(await challengeRows(t)).toHaveLength(1);
  });
});
