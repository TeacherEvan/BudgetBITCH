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

async function seedCoupleBoard(a: any, b: any, boardId: string) {
  await t.run(async (ctx: any) => {
    await ctx.db.insert("userProfiles", { userId: a, shareCode: "AAAA1111", linkedBoardId: boardId });
    await ctx.db.insert("userProfiles", { userId: b, shareCode: "BBBB2222", linkedBoardId: boardId });
    await ctx.db.insert("sharedBoards", {
      boardId,
      memberA: a,
      memberB: b,
      data: {
        "expenses:e1": { value: { id: "e1", category: "food", amount: 50 }, updatedAt: 1000 },
      },
      updatedAt: 1000,
      updatedBy: a,
    });
  });
}

describe("pendingDeletes (two-party consent)", () => {
  test("requester proposes, other member approves → item deleted on board", async () => {
    const a = await seedUser(t, "alice");
    const b = await seedUser(t, "bob");
    await seedCoupleBoard(a, b, "board_1");

    const { pendingId } = await asUser(a).mutation(api.pendingDeletes.requestItemDelete, {
      boardId: "board_1",
      store: "expenses",
      itemId: "e1",
    });

    // Self-approve must be forbidden.
    await expect(
      asUser(a).mutation(api.pendingDeletes.approveItemDelete, { pendingId }),
    ).rejects.toThrow(/own delete request/);

    // Other member approves → executes.
    const res = await asUser(b).mutation(api.pendingDeletes.approveItemDelete, { pendingId });
    expect(res.approved).toBe(true);

    const board = await t.run(async (ctx: any) =>
      ctx.db.query("sharedBoards").withIndex("by_boardId", (q: any) => q.eq("boardId", "board_1")).unique(),
    );
    expect(board.data["expenses:e1"]).toBeUndefined();
  });

  test("other member rejects → no delete happens", async () => {
    const a = await seedUser(t, "alice");
    const b = await seedUser(t, "bob");
    await seedCoupleBoard(a, b, "board_2");

    const { pendingId } = await asUser(a).mutation(api.pendingDeletes.requestItemDelete, {
      boardId: "board_2",
      store: "expenses",
      itemId: "e1",
    });
    const res = await asUser(b).mutation(api.pendingDeletes.rejectItemDelete, { pendingId });
    expect(res.rejected).toBe(true);

    const board = await t.run(async (ctx: any) =>
      ctx.db.query("sharedBoards").withIndex("by_boardId", (q: any) => q.eq("boardId", "board_2")).unique(),
    );
    expect(board.data["expenses:e1"]).toBeDefined();
  });

  test("requester can cancel (reject) their own pending request", async () => {
    const a = await seedUser(t, "alice");
    const b = await seedUser(t, "bob");
    await seedCoupleBoard(a, b, "board_3");

    const { pendingId } = await asUser(a).mutation(api.pendingDeletes.requestItemDelete, {
      boardId: "board_3",
      store: "expenses",
      itemId: "e1",
    });
    // Requester rejects == cancel, allowed.
    const res = await asUser(a).mutation(api.pendingDeletes.rejectItemDelete, { pendingId });
    expect(res.rejected).toBe(true);

    const rows = await t.run(async (ctx: any) => ctx.db.query("pendingDeletes").collect());
    expect(rows[0].status).toBe("rejected");
  });

  test("non-member cannot request", async () => {
    const a = await seedUser(t, "alice");
    const b = await seedUser(t, "bob");
    const c = await seedUser(t, "carol");
    await seedCoupleBoard(a, b, "board_4");

    await expect(
      asUser(c).mutation(api.pendingDeletes.requestItemDelete, {
        boardId: "board_4",
        store: "expenses",
        itemId: "e1",
      }),
    ).rejects.toThrow(/Not a member/);
  });

  test("listPendingDeletes marks canAct only for the other member", async () => {
    const a = await seedUser(t, "alice");
    const b = await seedUser(t, "bob");
    await seedCoupleBoard(a, b, "board_5");

    await asUser(a).mutation(api.pendingDeletes.requestItemDelete, {
      boardId: "board_5",
      store: "expenses",
      itemId: "e1",
    });

    const asRequester = await asUser(a).query(api.pendingDeletes.listPendingDeletes, { boardId: "board_5" });
    expect(asRequester[0].isRequester).toBe(true);
    expect(asRequester[0].canAct).toBe(false);

    const asPartner = await asUser(b).query(api.pendingDeletes.listPendingDeletes, { boardId: "board_5" });
    expect(asPartner[0].isRequester).toBe(false);
    expect(asPartner[0].canAct).toBe(true);
  });
});
