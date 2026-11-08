// convex/lib/notify.ts
// Plain helper for scheduling push notifications — no exported Convex functions.
// Imports internal from _generated/api to avoid circular deps.

import { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/** Schedule a push notification for a user via the internal pushSend action. */
export async function notifyPartner(
  ctx: MutationCtx,
  _boardId: string,
  toUserId: Id<"users">,
  title: string,
  body: string,
): Promise<string> {
  // Schedule the push notification via the internal pushSend action.
  // Using runAfter(0, ...) for fire-and-forget semantics — a missing VAPID config
  // in pushSend will log a warning but won't block the delete request.
  // Returns the scheduler job id so mutations can surface proof of scheduling
  // through their return value (mutation-level observability for tests).
  return ctx.scheduler.runAfter(0, internal.pushSend._sendToUser, {
    userId: toUserId,
    title,
    body,
  }) as Promise<string>;
}