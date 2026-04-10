import { NextResponse } from "next/server";
import { replayDailyCheckInProjectionJobs } from "@/modules/projections/replay-check-in-jobs";

const DEFAULT_CRON_REPLAY_LIMIT = 25;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await replayDailyCheckInProjectionJobs({
    limit: DEFAULT_CRON_REPLAY_LIMIT,
  });

  return NextResponse.json(result);
}
