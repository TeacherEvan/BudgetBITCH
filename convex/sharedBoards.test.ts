/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
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

async function makeProfile(userId: any, shareCode: string, linkedBoardId?: string, displayName?: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("userProfiles", { userId, shareCode, ...(linkedBoardId ? { linkedBoardId } : {}), ...(displayName ? { displayName } : {}) }),
  );
}

async function linkAndGetBoard(aliceId: any, bobId: any) {
  await makeProfile(aliceId, "ALICE123");
  await makeProfile(bobId, "BOB1234");
  const boardId = await asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: "BOB1234" });
  return boardId as string;
}

describe("pushBoard merge semantics", () => {
  test("incoming records merge by key instead of clobbering the whole board", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const boardId = await linkAndGetBoard(aliceId, bobId);

    // Alice pushes an expense.
    const aliceData = {
      "expenses:e1": { id: "e1", merchant: "Grab", amount: 120, updatedAt: 1000 },
    };
    await asUser(aliceId).mutation(api.sharedBoards.pushBoard, { boardId, data: aliceData, updatedAt: 1000 });

    // Bob pushes a DIFFERENT expense (later timestamp).
    const bobData = {
      "expenses:e2": { id: "e2", merchant: "Netflix", amount: 429, updatedAt: 2000 },
    };
    await asUser(bobId).mutation(api.sharedBoards.pushBoard, { boardId, data: bobData, updatedAt: 2000 });

    const board = await asUser(aliceId).query(api.sharedBoards.getBoard, { boardId });
    const data = (board as any).data as Record<string, any>;
    expect(Object.keys(data).sort()).toEqual(["expenses:e1", "expenses:e2"]);
    expect(data["expenses:e1"].merchant).toBe("Grab");
    expect(data["expenses:e2"].merchant).toBe("Netflix");
  });

  test("rejects stale pushes that don't get re-queued forever (applied:true even when older)", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const boardId = await linkAndGetBoard(aliceId, bobId);

    await asUser(aliceId).mutation(api.sharedBoards.pushBoard, {
      boardId,
      data: { "expenses:e1": { id: "e1", merchant: "Grab", amount: 120, updatedAt: 5000 } },
      updatedAt: 5000,
    });
    // Bob pushes an OLDER update after Alice. Must still apply the delta and NOT
    // loop forever — return applied:true so the client queue drains.
    const res = await asUser(bobId).mutation(api.sharedBoards.pushBoard, {
      boardId,
      data: { "expenses:bob": { id: "bob", merchant: "Lotus", amount: 50, updatedAt: 1000 } },
      updatedAt: 1000,
    });
    expect((res as any).applied).toBe(true);

    const board = await asUser(aliceId).query(api.sharedBoards.getBoard, { boardId });
    const data = (board as any).data as Record<string, any>;
    expect(data["expenses:bob"].merchant).toBe("Lotus");
  });

  test("incoming record does not overwrite a newer same-key local record", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const boardId = await linkAndGetBoard(aliceId, bobId);

    await asUser(aliceId).mutation(api.sharedBoards.pushBoard, {
      boardId,
      data: { "expenses:e1": { id: "e1", merchant: "Grab", amount: 999, updatedAt: 9000 } },
      updatedAt: 9000,
    });
    // Bob pushes a STALE version of e1 (older timestamp).
    const res = await asUser(bobId).mutation(api.sharedBoards.pushBoard, {
      boardId,
      data: { "expenses:e1": { id: "e1", merchant: "Grab", amount: 100, updatedAt: 1000 } },
      updatedAt: 1000,
    });
    expect((res as any).applied).toBe(true);

    const board = await asUser(aliceId).query(api.sharedBoards.getBoard, { boardId });
    const data = (board as any).data as Record<string, any>;
    expect(data["expenses:e1"].amount).toBe(999); // newer value preserved
  });
});

describe("getPartner", () => {
  test("returns the linked partner's displayName and shareCode", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    await makeProfile(aliceId, "ALICE123");
    await makeProfile(bobId, "BOB1234", undefined, "Bob");
    await asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: "BOB1234" });

    const partner = await asUser(aliceId).query(api.sharedBoards.getPartner, {});
    expect((partner as any).displayName).toBe("Bob");
    expect((partner as any).shareCode).toBe("BOB1234");
  });

  test("returns null when not linked", async () => {
    const aliceId = await seedUser(t, "alice");
    await makeProfile(aliceId, "ALICE123");
    const partner = await asUser(aliceId).query(api.sharedBoards.getPartner, {});
    expect(partner).toBeNull();
  });
});

describe("linkByCode re-link guards", () => {
  test("cannot link when already linked to a partner", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const carolId = await seedUser(t, "carol");
    await makeProfile(aliceId, "ALICE123");
    await makeProfile(bobId, "BOB1234");
    await makeProfile(carolId, "CAROL12");

    // Alice links to Bob first.
    await asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: "BOB1234" });
    // Alice tries to re-link to Carol — must be rejected (F3).
    await expect(
      asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: "CAROL12" }),
    ).rejects.toThrow(/already linked/);
  });

  test("cannot link into a partner who is already linked to someone else", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const carolId = await seedUser(t, "carol");
    await makeProfile(aliceId, "ALICE123");
    await makeProfile(bobId, "BOB1234");
    await makeProfile(carolId, "CAROL12");

    // Bob links to Carol.
    await asUser(bobId).mutation(api.sharedBoards.linkByCode, { code: "CAROL12" });
    // Alice tries to link to Bob (now taken) — must be rejected (F3).
    await expect(
      asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: "BOB1234" }),
    ).rejects.toThrow(/already linked to someone else/);
  });
});
