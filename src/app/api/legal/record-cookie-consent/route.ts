import { NextRequest, NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convex/http-client";
import { api } from "../../../../../convex/_generated/api";
import { clientIp } from "@/lib/http/client-ip";
import { z } from "zod";

export const runtime = "nodejs";

// Server-trusted relay for optional cookie-consent recording.
//
// Convex Auth now stores the JWT in localStorage (client-only), so the server
// cannot read a cookie-resolved token. The signed-in client forwards its JWT
// via useAuthToken(); anonymous visitors send none. The forwarded JWT is a
// signed Convex token, so it's safe to trust as the bearer for resolving
// identity (the same token the browser uses for WebSocket calls).
const Body = z.object({
  accepted: z.boolean(),
  optionalAccepted: z.boolean(),
  version: z.string(),
  userAgent: z.string().optional(),
  // Forwarded by the client only when a Convex Auth token exists.
  token: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { accepted, optionalAccepted, version, userAgent, token } = parsed.data;

  // Client-forwarded JWT only (no server cookie in localStorage auth mode).
  const authToken = token || undefined;
  try {
    const client = getConvexHttpClient({ auth: authToken });
    const { id } = await client.mutation(api.legal.recordCookieConsent, {
      accepted,
      optionalAccepted,
      version,
      userAgent: userAgent ?? undefined,
      // Server-resolved: not client-supplied, so it cannot be spoofed.
      ipAddress: clientIp(req),
    });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[record-cookie-consent] relay failed:", error);
    return NextResponse.json(
      { error: "Failed to record cookie consent" },
      { status: 502 },
    );
  }
}
