// One-time backend seeding: link a LINE user ID to a Budget Boss account.
// No app UI required. Run via `npx convex run seedLineLink:linkOwnerLineId`.
//
// The LINE user ID is the technical UID the bot transmits in event.source.userId
// (U + 32 hex chars), NOT the LINE display name / login.
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Owner identity resolved from the live Convex export (ewiebotha@gmail.com / "Evan").
const OWNER_USER_ID = "jd72jzbdc1zs0n31xprt265j4185xvxn";
const OWNER_ACCOUNT_ID = "f672cb47-c67f-405d-b970-568b3529bf17";
// Technical LINE UID confirmed in TeacherBOY .env EVAN_USER_ID + calendar_events.json.
const OWNER_LINE_USER_ID = "U5390303cc145d53483ee15b4ec61d8f0";

export const linkOwnerLineId = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("lineUsers")
      .withIndex("by_lineUserId", (q) => q.eq("lineUserId", OWNER_LINE_USER_ID))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: OWNER_USER_ID as any,
        accountId: OWNER_ACCOUNT_ID,
        linkedAt: Date.now(),
      });
      return { upserted: true, id: existing._id };
    }

    const id = await ctx.db.insert("lineUsers", {
      lineUserId: OWNER_LINE_USER_ID,
      userId: OWNER_USER_ID as any,
      accountId: OWNER_ACCOUNT_ID,
      linkedAt: Date.now(),
    });
    return { upserted: false, id };
  },
});
