import { buildLocationKey, buildRegionKey } from "@/modules/start-smart/location-catalog";
import { buildRegionalSnapshot } from "@/modules/start-smart/regional-data";
import { fetchRegionalData } from "@/modules/start-smart/regional-fetch";
import { getRegionalSeed } from "@/modules/start-smart/regional-seed";
import { NextResponse } from "next/server";
import { z } from "zod";

const regionalRequestSchema = z.object({
  countryCode: z.string().trim().length(2),
  stateCode: z.string().trim().min(2).max(64),
  cityCode: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = regionalRequestSchema.parse(body);
  const regionKey = buildRegionKey(input.countryCode, input.stateCode);
  const locationKey = buildLocationKey(input.countryCode, input.stateCode, input.cityCode);
  const fetched = await fetchRegionalData(locationKey);
  const snapshot = buildRegionalSnapshot({
    regionKey,
    locationKey,
    seed: getRegionalSeed(locationKey),
    fetched,
  });

  return NextResponse.json(snapshot);
}
