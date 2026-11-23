import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { lineWebhook } from "./line";
import { ingestReceipt } from "./receipts";

const http = httpRouter();

/** Length-independent, data-independent comparison of two secret strings.
 * Used so a wrong `x-bot-secret` cannot be distinguished by early exit. */
function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

auth.addHttpRoutes(http);

// LINE Messaging API webhook for the receipt bot (HMAC-verified).
http.route({
  path: "/line/webhook",
  method: "POST",
  handler: lineWebhook,
});

// Budget Boss receipt ingestion from TeacherBOY (Bearer token verified).
http.route({
  path: "/receipts/ingest",
  method: "POST",
  handler: ingestReceipt,
});

// W7: bot-callable challenge issuer. The external LINE bot holds the shared
// secret and posts a LINE user id here; the returned code is delivered to the
// user out-of-band and submitted from the app via `linkLineAccount`.
// `issueLineLinkChallenge` stays internal — only this endpoint is public.
http.route({
  path: "/api/line/link-challenge",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.LINE_BOT_LINK_SECRET;
    if (!secret) {
      return jsonResponse({ error: "LINE link challenges are not configured" }, 503);
    }

    const provided = req.headers.get("x-bot-secret") ?? "";
    if (!constantTimeEqual(provided, secret)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const lineUserId =
      payload && typeof payload === "object"
        ? (payload as { lineUserId?: unknown }).lineUserId
        : undefined;
    if (typeof lineUserId !== "string" || !lineUserId.trim()) {
      return jsonResponse(
        { error: "lineUserId must be a non-empty string" },
        400,
      );
    }

    const challenge = await ctx.runMutation(internal.line.issueLineLinkChallenge, {
      lineUserId,
    });
    // Return exactly the internal mutation's result shape — do not add the
    // shared secret or any other bot-only data to the response.
    return jsonResponse(
      {
        code: challenge.code,
        lineUserId: challenge.lineUserId,
        expiresAt: challenge.expiresAt,
      },
      200,
    );
  }),
});

export default http;
