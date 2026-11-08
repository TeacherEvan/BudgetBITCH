// convex/pushSend.ts
// Web Push (VAPID) sender — "use node" because `web-push` uses Node APIs.
// Free, self-hosted: VAPID keys live in Convex env, the library sends directly.
// No third-party push service.
"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import type { DocumentByName } from "convex/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import webpush from "web-push";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

// Internal action that takes userId explicitly - called by scheduler from pendingDeletes
export const _sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { userId, title, body }): Promise<{ sent: number; total: number }> => {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn("VAPID keys not configured; push notifications skipped.");
      return { sent: 0, total: 0 };
    }

    webpush.setVapidDetails(
      "mailto:support@budget-boss.app",
      VAPID_PUBLIC,
      VAPID_PRIVATE,
    );

    const subs: DocumentByName<DataModel, "pushSubscriptions">[] =
      await ctx.runQuery(internal.push._listForUser, { userId });

    const payload = JSON.stringify({ title, body });
    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.subscription.endpoint,
            keys: sub.subscription.keys,
          },
          payload,
        );
        sent++;
      } catch (err) {
        // 404/410 = subscription expired/invalid → remove it.
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.push._remove, { id: sub._id });
        }
      }
    }
    return { sent, total: subs.length };
  },
  returns: v.object({ sent: v.number(), total: v.number() }),
});

// Public action for client calls (uses auth)
export const sendReminder = action({
  args: {
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { title, body }): Promise<{ sent: number; total: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    return ctx.runAction(internal.pushSend._sendToUser, { userId, title, body });
  },
  returns: v.object({ sent: v.number(), total: v.number() }),
});
