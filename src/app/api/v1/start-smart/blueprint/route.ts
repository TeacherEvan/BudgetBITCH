import { buildProfileRecord } from "@/modules/start-smart/profile-record";
import {
  normalizeStartSmartProfile,
  startSmartProfileSchema,
} from "@/modules/start-smart/profile-schema";
import { generateMoneySurvivalBlueprint } from "@/modules/start-smart/blueprint-engine";
import { buildRegionalSnapshot } from "@/modules/start-smart/regional-data";
import { fetchRegionalData } from "@/modules/start-smart/regional-fetch";
import { getRegionalSeed } from "@/modules/start-smart/regional-seed";
import { getPrismaClient } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type JsonInput =
  | string
  | number
  | boolean
  | { [key: string]: JsonInput | null }
  | (JsonInput | null)[];

const blueprintRequestSchema = z.object({
  workspaceId: z.string().trim().min(1),
  templateId: z.string().trim().min(1).optional(),
  answers: startSmartProfileSchema,
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = blueprintRequestSchema.parse(body);
  const profile = normalizeStartSmartProfile(input.answers);
  const fetched = await fetchRegionalData(profile.regionKey);
  const regional = buildRegionalSnapshot({
    regionKey: profile.regionKey,
    seed: getRegionalSeed(profile.regionKey),
    fetched,
  });
  const blueprint = generateMoneySurvivalBlueprint({ profile, regional });
  const profileRecord = buildProfileRecord({
    workspaceId: input.workspaceId,
    templateId: input.templateId,
    regionKey: profile.regionKey,
    householdKind: profile.householdKind,
    profile,
  });

  let persistence: { persisted: boolean; profileId?: string; reason?: string } =
    {
      persisted: false,
      reason: "not_attempted",
    };

  try {
    const prisma = getPrismaClient();

    const savedProfile = await prisma.startSmartProfile.create({
        data: {
          ...profileRecord,
          profileJson: profileRecord.profileJson as JsonInput,
        },
      });

    await prisma.regionalSnapshot.create({
        data: {
          workspaceId: input.workspaceId,
          profileId: savedProfile.id,
          regionKey: regional.regionKey,
          confidence: "verified",
          assumptionsJson: regional as JsonInput,
        },
      });

    await prisma.moneyBlueprintSnapshot.create({
        data: {
          workspaceId: input.workspaceId,
          profileId: savedProfile.id,
          regionKey: profile.regionKey,
          householdKind: profile.householdKind,
          status: "generated",
          blueprintJson: blueprint as JsonInput,
        },
      });

    persistence = {
      persisted: true,
      profileId: savedProfile.id,
    };
  } catch (error) {
    persistence = {
      persisted: false,
      reason:
        error instanceof Error ? error.message : "unknown_persistence_error",
    };
  }

  return NextResponse.json({
    profile,
    regional,
    blueprint,
    persistence,
  });
}
