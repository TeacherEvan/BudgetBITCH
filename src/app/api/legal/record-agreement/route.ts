import { NextRequest, NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convex/http-client";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "../../../../../convex/_generated/api";
import { clientIp } from "@/lib/http/client-ip";
import { z } from "zod";

export const runtime = "nodejs";

// Server-trusted relay for legal acceptance recording.
//
// Convex mutations run over a WebSocket and cannot see the originating HTTP
// request, so the client IP (fraud/audit evidence) must be captured here, on
// the server, from the real forwarding header before being recorded. The IP is
// read from x-forwarded-for / x-real-ip and is NOT client-supplied.
//
// The app stores the Convex Auth token in localStorage, so the server cannot
// read the freshly signed-up user's token itself. The client forwards its JWT
// (via useAuthToken) and the server adds it as a Bearer token so Convex Auth
// resolves the identity the same as the browser would.
const Body = z.object({
  termsVersion: z.string(),
  privacyVersion: z.string(),
  userAgent: z.string().optional(),
  // Client-forwarded fallback only. The server prefers the cookie-resolved
  // token (see convexAuthNextjsToken below); useAuthToken() on the client may
  // still be empty at POST time, so a blank token must not 400 the request.
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

  const { termsVersion, privacyVersion, userAgent, token } = parsed.data;

  // Defense in depth: prefer the server-resolved token, fall back to the
  // client-forwarded one (necessary for localStorage-based Convex Auth).
  const authToken = (await convexAuthNextjsToken()) || token;

  const client = getConvexHttpClient({ auth: authToken });

  try {
    const { id } = await client.mutation(api.legal.recordAgreement, {
      termsVersion,
      privacyVersion,
      userAgent: userAgent ?? undefined,
      ipAddress: clientIp(req),
    });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[record-agreement] relay failed:", error);
    return NextResponse.json(
      { error: "Failed to record agreement" },
      { status: 502 },
    );
  }
}
