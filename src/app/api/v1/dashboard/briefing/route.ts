import { NextResponse } from "next/server";
import { loadDashboardBriefing } from "@/modules/dashboard/briefing/fetch-briefing";

const BRIEFING_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";

function shouldForceRefresh(request: Request) {
  const refreshValue = new URL(request.url).searchParams.get("refresh");

  return refreshValue === "1" || refreshValue === "true";
}

export async function GET(request: Request) {
  const briefing = await loadDashboardBriefing({
    forceRefresh: shouldForceRefresh(request),
  });

  return NextResponse.json(briefing, {
    headers: {
      "Cache-Control": BRIEFING_CACHE_CONTROL,
    },
  });
}
