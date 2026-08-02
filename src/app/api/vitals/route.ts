import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Sink for web-vitals beacons sent from src/lib/web-vitals.ts.
//
// The client emits CLS/FCP/INP/LCP/TTFB as sendBeacon POSTs (or fetch
// keepalive fallback). There is no signed-in identity requirement for
// performance telemetry, so this handler only validates shape and
// acknowledges — it intentionally does NOT write to Convex. Persisting
// metrics to an analytics store is out of scope; the missing endpoint
// only caused a silent 404 that dropped every prod sample.
const Metric = z.object({
  name: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]),
  value: z.number(),
  delta: z.number().optional(),
  id: z.string().optional(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  navigationType: z.string().optional(),
  timestamp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Metric.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid metric payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Best-effort RUM ingest point. Swap this for a real analytics sink
  // (GA4 / Convex mutation / external collector) without changing the client.
  if (process.env.NODE_ENV !== "production") {
    console.log("[Web Vitals]", parsed.data);
  }

  return new NextResponse(null, { status: 204 });
}
