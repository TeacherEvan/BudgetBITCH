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

async function makeProfile(
  userId: any,
  shareCode: string,
  extra: Record<string, any> = {},
) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("userProfiles", { userId, shareCode, ...extra }),
  );
}

async function createAccount(
  ownerId: any,
  umbrella: string,
  name: string,
) {
  return asUser(ownerId).mutation(api.accounts.createAccount, {
    umbrella,
    name,
  }) as Promise<{ accountId: string; boardId: string; inviteCode: string }>;
}

describe("createAccount", () => {
  test("creates an owned account + board + owner membership", async () => {
    const aliceId = await seedUser(t, "alice");
    const res = await createAccount(aliceId, "business", "Acme Books");
    expect(res.accountId).toBeTruthy();
    expect(res.boardId).toBeTruthy();
    expect(res.inviteCode).toHaveLength(8);

    const listed = await asUser(aliceId).query(api.accounts.listMyAccounts, {});
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe("Acme Books");
    expect(listed[0].umbrella).toBe("business");
    expect(listed[0].role).toBe("owner");
    expect(listed[0].memberCount).toBe(1);
    expect(listed[0].inviteCode).toBe(res.inviteCode);
  });

  test("enforces the 5-account cap", async () => {
    const aliceId = await seedUser(t, "alice");
    for (let i = 0; i < 5; i++) {
      await createAccount(aliceId, "family", `Acct ${i}`);
    }
    await expect(
      createAccount(aliceId, "family", "Sixth"),
    ).rejects.toThrow(/at most 5/);
  });

  test("generates a unique invite code per account", async () => {
    const aliceId = await seedUser(t, "alice");
    const a = await createAccount(aliceId, "family", "A");
    const b = await createAccount(aliceId, "family", "B");
    expect(a.inviteCode).not.toBe(b.inviteCode);
  });

  test("rejects invalid umbrella", async () => {
    const aliceId = await seedUser(t, "alice");
    await expect(
      asUser(aliceId).mutation(api.accounts.createAccount, {
        umbrella: "nope",
        name: "X",
      }),
    ).rejects.toThrow(/Invalid umbrella/);
  });

  test("rejects empty / over-long names", async () => {
    const aliceId = await seedUser(t, "alice");
    await expect(
      asUser(aliceId).mutation(api.accounts.createAccount, {
        umbrella: "family",
        name: "   ",
      }),
    ).rejects.toThrow(/1–40/);
    await expect(
      asUser(aliceId).mutation(api.accounts.createAccount, {
        umbrella: "family",
        name: "x".repeat(41),
      }),
    ).rejects.toThrow(/1–40/);
  });
});

describe("pushAccountBoard merge semantics", () => {
  test("incoming records merge by key instead of clobbering the whole board", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    // Link Bob in via invite + accept.
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    const aliceData = {
      "expenses:e1": { id: "e1", merchant: "Grab", amount: 120, updatedAt: 1000 },
    };
    await asUser(aliceId).mutation(api.accounts.pushAccountBoard, {
      boardId,
      data: aliceData,
      updatedAt: 1000,
    });
    const bobData = {
      "expenses:e2": { id: "e2", merchant: "Netflix", amount: 429, updatedAt: 2000 },
    };
    await asUser(bobId).mutation(api.accounts.pushAccountBoard, {
      boardId,
      data: bobData,
      updatedAt: 2000,
    });

    const board = await asUser(aliceId).query(api.accounts.getAccountBoard, {
      boardId,
    });
    const data = (board as any).data as Record<string, any>;
    expect(Object.keys(data).sort()).toEqual(["expenses:e1", "expenses:e2"]);
    expect(data["expenses:e1"].merchant).toBe("Grab");
    expect(data["expenses:e2"].merchant).toBe("Netflix");
  });

  test("incoming record does not overwrite a newer same-key local record", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    await asUser(aliceId).mutation(api.accounts.pushAccountBoard, {
      boardId,
      data: { "expenses:e1": { id: "e1", merchant: "Grab", amount: 999, updatedAt: 9000 } },
      updatedAt: 9000,
    });
    await asUser(bobId).mutation(api.accounts.pushAccountBoard, {
      boardId,
      data: { "expenses:e1": { id: "e1", merchant: "Grab", amount: 100, updatedAt: 1000 } },
      updatedAt: 1000,
    });
    const board = await asUser(aliceId).query(api.accounts.getAccountBoard, {
      boardId,
    });
    expect(((board as any).data as any)["expenses:e1"].amount).toBe(999);
  });
});

describe("invites + membership", () => {
  test("inviteByCode enforces the 8-member cap", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId } = await createAccount(aliceId, "friends", "Crew");
    // 7 invited members (owner + 7 = 8).
    const others: any[] = [];
    for (let i = 0; i < 7; i++) {
      const id = await seedUser(t, `p${i}`);
      others.push(id);
      await makeProfile(id, `P${i}XXXXX`.slice(0, 8));
      await asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: `P${i}XXXXX`.slice(0, 8),
      });
    }
    // 8th should be rejected.
    const extra = await seedUser(t, "extra");
    await makeProfile(extra, "EXTRA999");
    await expect(
      asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: "EXTRA999",
      }),
    ).rejects.toThrow(/at most 8/);
  });

  test("acceptInvite adds boardMembers + joinedBoardIds", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    expect(invites).toHaveLength(1);
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    const listed = await asUser(bobId).query(api.accounts.listMyAccounts, {});
    expect(listed.find((a: any) => a.boardId === boardId)?.role).toBe("member");

    const board = await asUser(bobId).query(api.accounts.getAccountBoard, {
      boardId,
    });
    expect((board as any).members.length).toBe(2);
  });

  test("invite self / unknown code rejected", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId } = await createAccount(aliceId, "family", "Fam");
    await makeProfile(aliceId, "ALICE123");
    await expect(
      asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: "ALICE123",
      }),
    ).rejects.toThrow(/yourself/);
    await expect(
      asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: "ZZZZZZZZ",
      }),
    ).rejects.toThrow(/not found/);
  });

  test("resolveInviteCode returns account name", async () => {
    const aliceId = await seedUser(t, "alice");
    const { inviteCode } = await createAccount(aliceId, "charity", "Good Cause");
    const res = await asUser(aliceId).query(api.accounts.resolveInviteCode, {
      code: inviteCode,
    });
    expect((res as any).exists).toBe(true);
    expect((res as any).name).toBe("Good Cause");
  });
});

describe("authz + deletion", () => {
  test("getAccountBoard rejects non-member", async () => {
    const aliceId = await seedUser(t, "alice");
    const carolId = await seedUser(t, "carol");
    const { boardId } = await createAccount(aliceId, "family", "Fam");
    await expect(
      asUser(carolId).query(api.accounts.getAccountBoard, { boardId }),
    ).rejects.toThrow(/Not a member/);
  });

  test("non-owner cannot rename / invite / remove", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    await expect(
      asUser(bobId).mutation(api.accounts.renameAccount, {
        accountId,
        name: "Hacked",
      }),
    ).rejects.toThrow(/owner can rename/);
    await expect(
      asUser(bobId).mutation(api.accounts.deleteAccount, { accountId }),
    ).rejects.toThrow(/owner can delete/);
    await expect(
      asUser(bobId).mutation(api.accounts.removeMember, {
        accountId,
        userId: aliceId,
      }),
    ).rejects.toThrow(/owner can remove/);
  });

  test("owner cannot be removed or leave", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    await expect(
      asUser(aliceId).mutation(api.accounts.removeMember, {
        accountId,
        userId: aliceId,
      }),
    ).rejects.toThrow(/cannot be removed/);
    await expect(
      asUser(aliceId).mutation(api.accounts.leaveAccount, { accountId }),
    ).rejects.toThrow(/cannot leave/);
    void boardId;
  });

  test("deleteAccount cleans orphan board + members + invites", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Fam",
    );
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: invites[0].inviteId,
    });

    await asUser(aliceId).mutation(api.accounts.deleteAccount, { accountId });

    await expect(
      asUser(bobId).query(api.accounts.getAccountBoard, { boardId }),
    ).rejects.toThrow(/Board not found/);
    const listed = await asUser(aliceId).query(api.accounts.listMyAccounts, {});
    expect(listed.find((a: any) => a.boardId === boardId)).toBeUndefined();
  });

  test("listMyAccounts surfaces legacy couple board as 'couple' umbrella", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    await makeProfile(aliceId, "ALICE123");
    await makeProfile(bobId, "BOB12345");
    // Wire a legacy couple board manually (mimics useSharedBoard.linkByCode).
    const boardId = "legacy-couple-1";
    await t.run(async (ctx: any) => {
      await ctx.db.insert("sharedBoards", {
        boardId,
        memberA: aliceId,
        memberB: bobId,
        data: null,
        updatedAt: Date.now(),
        updatedBy: aliceId,
      });
      await ctx.db.patch(
        (await ctx.db.query("userProfiles").withIndex("by_user", (q: any) => q.eq("userId", aliceId)).unique())._id,
        { linkedBoardId: boardId },
      );
    });
    const listed = await asUser(aliceId).query(api.accounts.listMyAccounts, {});
    const couple = listed.find((a: any) => a.umbrella === "couple");
    expect(couple).toBeTruthy();
    expect(couple!.boardId).toBe(boardId);
  });
});

describe("invite token (QR / link)", () => {
  test("owner creates a token, joiner redeems it and becomes a member", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Our Family");

    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });
    expect(token).toBeTruthy();

    const res = await asUser(bobId).mutation(api.accounts.redeemInviteToken, { token });
    expect(res.accountId).toBe(accountId);
    expect(res.boardId).toBe(boardId);
    expect(res.alreadyMember).toBe(false);

    // Bob now sees the account as a joined member.
    const bobListed = await asUser(bobId).query(api.accounts.listMyAccounts, {});
    const joined = bobListed.find((a: any) => a.accountId === accountId);
    expect(joined).toBeTruthy();
    expect(joined!.role).toBe("member");
    expect(joined!.memberCount).toBe(2);
  });

  test("redeeming an unknown token throws", async () => {
    const bobId = await seedUser(t, "bob");
    await expect(
      asUser(bobId).mutation(api.accounts.redeemInviteToken, { token: "nope" }),
    ).rejects.toThrow(/invalid or expired/);
  });

  test("redeem is idempotent for the same user", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId } = await createAccount(aliceId, "friends", "Crew");
    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });
    await asUser(bobId).mutation(api.accounts.redeemInviteToken, { token });
    const again = await asUser(bobId).mutation(api.accounts.redeemInviteToken, { token });
    expect(again.alreadyMember).toBe(true);
  });

  test("token generation respects the member cap", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId } = await createAccount(aliceId, "school", "Class");
    // Fill the board to the cap with members directly.
    const others: any[] = [];
    for (let i = 0; i < 7; i++) others.push(await seedUser(t, `s${i}`));
    await t.run(async (ctx: any) => {
      const acc = await ctx.db
        .query("accounts")
        .withIndex("by_accountId", (q: any) => q.eq("accountId", accountId))
        .unique();
      for (const u of others) {
        await ctx.db.insert("boardMembers", {
          boardId: acc.boardId,
          userId: u,
          role: "member",
          joinedAt: Date.now(),
        });
      }
    });
    await expect(
      asUser(aliceId).mutation(api.accounts.createInviteToken, { accountId }),
    ).rejects.toThrow(/at most 8/);
  });

  test("redeemInviteToken keeps accountBoards.members in sync with boardMembers", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(
      aliceId,
      "family",
      "Our Family",
    );

    const { token } = await asUser(aliceId).mutation(
      api.accounts.createInviteToken,
      { accountId },
    );
    await asUser(bobId).mutation(api.accounts.redeemInviteToken, { token });

    // boardMembers is the source of truth.
    const memberRows = await t.run(async (ctx: any) =>
      ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect(),
    );
    expect(memberRows.length).toBe(2);

    // The redundant members array must not drift (review finding F2).
    const board = await asUser(bobId).query(api.accounts.getAccountBoard, {
      boardId,
    });
    expect((board as any).members.length).toBe(2);
    expect((board as any).members).toContain(bobId);
  });
});
