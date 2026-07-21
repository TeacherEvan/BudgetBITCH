import { NextRequest, NextResponse } from "next/server";
import { getConvexHttpClient } from "@/lib/convex/http-client";
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
// Convex Auth now stores the JWT in localStorage (client-only), so the server
// cannot read a cookie-resolved token. The signed-in client forwards its JWT
// via useAuthToken(); the forwarded JWT is a signed Convex token, trusted as
// the bearer for resolving identity (same token the browser uses for WS).
const Body = z.object({
  termsVersion: z.string(),
  privacyVersion: z.string(),
  userAgent: z.string().optional(),
  // Client-forwarded JWT (useAuthToken). No server cookie in localStorage mode.
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

  // Client-forwarded JWT only (no server cookie in localStorage auth mode).
  const authToken = token || undefined;

  try {
    const client = getConvexHttpClient({ auth: authToken });
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
