import { NextResponse } from "next/server";
import { z } from "zod";
import { replayDailyCheckInProjectionJobs } from "@/modules/projections/replay-check-in-jobs";

const schema = z.object({
  limit: z.number().int().min(1).max(25).optional(),
});

export async function POST(request: Request) {
  const syncSecret = process.env.CONVEX_SYNC_SECRET;
  const requestSecret = request.headers.get("x-convex-sync-secret");

  if (!syncSecret) {
    return NextResponse.json(
      { error: "CONVEX_SYNC_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  if (requestSecret !== syncSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bodyText = await request.text();
  const input = schema.parse(bodyText ? JSON.parse(bodyText) : {});
  const result = await replayDailyCheckInProjectionJobs({ limit: input.limit });

  return NextResponse.json(result);
}
