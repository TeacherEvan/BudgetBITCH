import { NextRequest, NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convex/http-client";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "../../../../../convex/_generated/api";
import { clientIp } from "@/lib/http/client-ip";
import { z } from "zod";

export const runtime = "nodejs";

// Server-trusted relay for optional cookie-consent recording.
//
// Mirrors /api/legal/record-agreement: the client IP is captured from the real
// request header (Convex mutations cannot see it). Cookie consent is anonymous
// by design, so the auth token is OPTIONAL — visitors who are not signed in
// stay anonymous (userId resolves to undefined in the mutation). When a token
// is present (signed-in user) their userId is attached, matching the prior
// behaviour of the direct Convex mutation.
const Body = z.object({
  accepted: z.boolean(),
  optionalAccepted: z.boolean(),
  version: z.string(),
  userAgent: z.string().optional(),
  // Optional: forwarded by the client only when a Convex Auth token exists.
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

  // Prefer the server-resolved token; fall back to the client-forwarded one.
  // Anonymous visitors send no token, so this stays undefined.
  const authToken = (await convexAuthNextjsToken()) || token || undefined;

  const client = getConvexHttpClient({ auth: authToken });

  try {
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
