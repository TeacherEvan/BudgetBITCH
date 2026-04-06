import { buildRegionalSnapshot } from "@/modules/start-smart/regional-data";
import { fetchRegionalData } from "@/modules/start-smart/regional-fetch";
import { getRegionalSeed } from "@/modules/start-smart/regional-seed";
import { NextResponse } from "next/server";
import { z } from "zod";

const regionalRequestSchema = z.object({
  countryCode: z.string().trim().length(2),
  stateCode: z.string().trim().min(2).max(3),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = regionalRequestSchema.parse(body);
  const regionKey = `${input.countryCode.toLowerCase()}-${input.stateCode.toLowerCase()}`;
  const fetched = await fetchRegionalData(regionKey);
  const snapshot = buildRegionalSnapshot({
    regionKey,
    seed: getRegionalSeed(regionKey),
    fetched,
  });

  return NextResponse.json(snapshot);
}
