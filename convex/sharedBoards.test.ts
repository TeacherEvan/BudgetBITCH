/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// getAuthUserId() splits identity.subject on a divider and returns the first
// part as the user _id. So we insert a users row and pass its _id as subject.
// (No need to populate the auth user table fully — the function only needs the id.)
function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;
const ALICE = "alice";
const BOB = "bob";

beforeEach(() => {
  t = convexTest(schema, modules);
});

const asUser = (userId: any) => t.withIdentity({ subject: userId });

test("ensureProfile creates a profile with a shareCode", async () => {
  const aliceId = await seedUser(t, ALICE);
  const profile = await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  expect(profile.shareCode).toMatch(/^[A-Z0-9]{8}$/);
  expect(profile.linkedBoardId).toBeNull();
});

test("getMyProfile returns null shareCode before ensureProfile", async () => {
  const aliceId = await seedUser(t, ALICE);
  const profile = await asUser(aliceId).query(api.sharedBoards.getMyProfile, {});
  expect(profile!.shareCode).toBeNull();
});

test("linkByCode links two users and returns a shared boardId", async () => {
  const aliceId = await seedUser(t, ALICE);
  const bobId = await seedUser(t, BOB);

  const alice = await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  const bob = await asUser(bobId).mutation(api.sharedBoards.ensureProfile, {});

  const boardId = await asUser(aliceId).mutation(api.sharedBoards.linkByCode, {
    code: bob.shareCode,
  });
  expect(typeof boardId).toBe("string");

  const aliceAfter = await asUser(aliceId).query(api.sharedBoards.getMyProfile, {});
  const bobAfter = await asUser(bobId).query(api.sharedBoards.getMyProfile, {});
  expect(aliceAfter!.linkedBoardId).toBe(boardId);
  expect(bobAfter!.linkedBoardId).toBe(boardId);

  const board = await asUser(aliceId).query(api.sharedBoards.getBoard, { boardId });
  expect([board.memberA, board.memberB].sort()).toEqual([aliceId, bobId].sort());
});

test("linkByCode rejects linking to your own code", async () => {
  const aliceId = await seedUser(t, ALICE);
  const alice = await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  await expect(
    asUser(aliceId).mutation(api.sharedBoards.linkByCode, { code: alice.shareCode }),
  ).rejects.toThrow(/yourself/);
});

test("resolveShareCode distinguishes partner vs self vs unknown", async () => {
  const aliceId = await seedUser(t, ALICE);
  const bobId = await seedUser(t, BOB);
  const alice = await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  const bob = await asUser(bobId).mutation(api.sharedBoards.ensureProfile, {});

  const partner = await asUser(aliceId).query(api.sharedBoards.resolveShareCode, {
    code: bob.shareCode,
  });
  expect(partner.exists).toBe(true);

  const self = await asUser(aliceId).query(api.sharedBoards.resolveShareCode, {
    code: alice.shareCode,
  });
  expect(self.exists).toBe(false);

  const unknown = await asUser(aliceId).query(api.sharedBoards.resolveShareCode, {
    code: "ZZZZZZZZ",
  });
  expect(unknown.exists).toBe(false);
});

test("pushBoard applies only if updatedAt is newer (LWW)", async () => {
  const aliceId = await seedUser(t, ALICE);
  const bobId = await seedUser(t, BOB);
  await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  const bob = await asUser(bobId).mutation(api.sharedBoards.ensureProfile, {});
  const boardId = await asUser(aliceId).mutation(api.sharedBoards.linkByCode, {
    code: bob.shareCode,
  });

  const base = Date.now();
  const first = await asUser(aliceId).mutation(api.sharedBoards.pushBoard, {
    boardId,
    data: { v: 1 },
    updatedAt: base + 1000,
  });
  expect(first.applied).toBe(true);

  const stale = await asUser(bobId).mutation(api.sharedBoards.pushBoard, {
    boardId,
    data: { v: 0 },
    updatedAt: base + 500,
  });
  expect(stale.applied).toBe(false);

  const newer = await asUser(bobId).mutation(api.sharedBoards.pushBoard, {
    boardId,
    data: { v: 2 },
    updatedAt: base + 2000,
  });
  expect(newer.applied).toBe(true);

  const board = await asUser(aliceId).query(api.sharedBoards.getBoard, { boardId });
  expect(board.data).toEqual({ v: 2 });
});

test("getBoard rejects a non-member", async () => {
  const aliceId = await seedUser(t, ALICE);
  const bobId = await seedUser(t, BOB);
  const eveId = await seedUser(t, "eve");
  await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  const bob = await asUser(bobId).mutation(api.sharedBoards.ensureProfile, {});
  const boardId = await asUser(aliceId).mutation(api.sharedBoards.linkByCode, {
    code: bob.shareCode,
  });

  await expect(
    asUser(eveId).query(api.sharedBoards.getBoard, { boardId }),
  ).rejects.toThrow(/member/);
});

test("unlink clears linkage and deletes the board when orphaned", async () => {
  const aliceId = await seedUser(t, ALICE);
  const bobId = await seedUser(t, BOB);
  await asUser(aliceId).mutation(api.sharedBoards.ensureProfile, {});
  const bob = await asUser(bobId).mutation(api.sharedBoards.ensureProfile, {});
  const boardId = await asUser(aliceId).mutation(api.sharedBoards.linkByCode, {
    code: bob.shareCode,
  });

  // Alice unlinks; Bob still linked → board kept.
  await asUser(aliceId).mutation(api.sharedBoards.unlink, {});
  const bobAfter = await asUser(bobId).query(api.sharedBoards.getMyProfile, {});
  expect(bobAfter!.linkedBoardId).toBe(boardId);
  await expect(
    asUser(bobId).query(api.sharedBoards.getBoard, { boardId }),
  ).resolves.toBeTruthy();

  // Bob unlinks → board orphaned → deleted.
  await asUser(bobId).mutation(api.sharedBoards.unlink, {});
  const aliceAfter = await asUser(aliceId).query(api.sharedBoards.getMyProfile, {});
  expect(aliceAfter!.linkedBoardId).toBeNull();
  await expect(
    asUser(aliceId).query(api.sharedBoards.getBoard, { boardId }),
  ).rejects.toThrow(/not found|member/);
});
