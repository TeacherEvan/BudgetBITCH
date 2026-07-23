// convex/pushSend.ts
// Web Push (VAPID) sender — "use node" because `web-push` uses Node APIs.
// Free, self-hosted: VAPID keys live in Convex env, the library sends directly.
// No third-party push service.
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import webpush from "web-push";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

export const sendReminder = action({
  args: {
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { title, body }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      webpush.setVapidDetails(
        "mailto:support@budget-boss.app",
        VAPID_PUBLIC,
        VAPID_PRIVATE,
      );
    }

    const subs: Array<{
      _id: any;
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    }> = await ctx.runQuery(internal.push._listForUser, { userId });

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
      } catch (err: any) {
        // 404/410 = subscription expired/invalid → remove it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await ctx.runMutation(internal.push._remove, { id: sub._id });
        }
      }
    }
    return { sent, total: subs.length };
  },
});
