/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, beforeEach, describe } from "vitest";
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

describe("push:subscribe", () => {
  test("stores a web-push subscription keyed by user", async () => {
    const aliceId = await seedUser(t, "alice");
    const sub = {
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "p256", auth: "auth" },
    };
    const id = await asUser(aliceId).mutation(api.push.subscribe, { subscription: sub });
    expect(id).toBeTruthy();

    const stored = await t.run(async (ctx: any) => ctx.db.get("pushSubscriptions", id));
    expect(stored.userId).toBe(aliceId);
    expect(stored.subscription.endpoint).toBe(sub.endpoint);
  });

  test("replaces an existing subscription for the same endpoint (no dupes)", async () => {
    const aliceId = await seedUser(t, "alice");
    const sub = { endpoint: "https://push.example.com/abc", keys: { p256dh: "p", auth: "a" } };
    const id1 = await asUser(aliceId).mutation(api.push.subscribe, { subscription: sub });
    const sub2 = { endpoint: "https://push.example.com/abc", keys: { p256dh: "p2", auth: "a2" } };
    const id2 = await asUser(aliceId).mutation(api.push.subscribe, { subscription: sub2 });
    expect(id1).toBe(id2);

    const all = await t.run(async (ctx: any) => ctx.db.query("pushSubscriptions").collect());
    expect(all).toHaveLength(1);
    expect(all[0].subscription.keys.p256dh).toBe("p2");
  });

  test("rejects unauthenticated subscribe", async () => {
    await expect(
      t.mutation(api.push.subscribe, {
        subscription: { endpoint: "x", keys: { p256dh: "p", auth: "a" } },
      }),
    ).rejects.toThrow();
  });
});

describe("push:unsubscribe", () => {
  test("removes the stored subscription", async () => {
    const aliceId = await seedUser(t, "alice");
    const sub = { endpoint: "https://push.example.com/abc", keys: { p256dh: "p", auth: "a" } };
    const id = await asUser(aliceId).mutation(api.push.subscribe, { subscription: sub });
    await asUser(aliceId).mutation(api.push.unsubscribe, { endpoint: sub.endpoint });

    const stored = await t.run(async (ctx: any) => ctx.db.get("pushSubscriptions", id));
    expect(stored).toBeNull();
  });
});
