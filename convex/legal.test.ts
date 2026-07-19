/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;
const asUser = (userId: any) => t.withIdentity({ subject: userId });

beforeEach(() => {
  t = convexTest(schema, modules);
});

test("recordAgreement inserts a timestamped record for the authenticated user", async () => {
  const aliceId = await seedUser(t, "alice");
  const res = await asUser(aliceId).mutation(api.legal.recordAgreement, {
    termsVersion: "2026-07-19",
    privacyVersion: "2026-07-19",
  });
  expect(res.id).toBeTruthy();

  const rows = await t.run(async (ctx: any) =>
    ctx.db.query("legalAgreements").collect(),
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(aliceId);
  expect(rows[0].termsVersion).toBe("2026-07-19");
  expect(rows[0].privacyVersion).toBe("2026-07-19");
  expect(typeof rows[0].acceptedAt).toBe("number");
});

test("recordAgreement requires authentication", async () => {
  await expect(
    t.mutation(api.legal.recordAgreement, {
      termsVersion: "2026-07-19",
      privacyVersion: "2026-07-19",
    }),
  ).rejects.toThrow(/Not authenticated/);
});

test("recordAgreement captures optional client metadata", async () => {
  const aliceId = await seedUser(t, "alice");
  await asUser(aliceId).mutation(api.legal.recordAgreement, {
    termsVersion: "2026-07-19",
    privacyVersion: "2026-07-19",
    ipAddress: "203.0.113.7",
    userAgent: "vitest-agent",
  });

  const rows = await t.run(async (ctx: any) =>
    ctx.db.query("legalAgreements").collect(),
  );
  expect(rows[0].ipAddress).toBe("203.0.113.7");
  expect(rows[0].userAgent).toBe("vitest-agent");
});

test("recordCookieConsent succeeds anonymously (auth-optional)", async () => {
  const res = await t.mutation(api.legal.recordCookieConsent, {
    accepted: true,
    optionalAccepted: false,
    version: "2026-07-19",
  });
  expect(res.id).toBeTruthy();

  const rows = await t.run(async (ctx: any) =>
    ctx.db.query("cookieConsents").collect(),
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBeUndefined();
  expect(rows[0].accepted).toBe(true);
  expect(rows[0].optionalAccepted).toBe(false);
  expect(rows[0].version).toBe("2026-07-19");
});

test("recordCookieConsent stores a server-supplied IP when provided", async () => {
  const aliceId = await seedUser(t, "alice");
  await asUser(aliceId).mutation(api.legal.recordCookieConsent, {
    accepted: true,
    optionalAccepted: true,
    version: "2026-07-19",
    ipAddress: "203.0.113.7",
    userAgent: "vitest-agent",
  });

  const rows = await t.run(async (ctx: any) =>
    ctx.db.query("cookieConsents").collect(),
  );
  expect(rows[0].ipAddress).toBe("203.0.113.7");
  expect(rows[0].userAgent).toBe("vitest-agent");
});

