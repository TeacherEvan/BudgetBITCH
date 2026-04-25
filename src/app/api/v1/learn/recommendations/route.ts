import { extractLearnSignalsFromBlueprint } from "@/modules/learn/blueprint-bridge";
import { resolveLearnRecommendations } from "@/modules/learn/recommendation-engine";
import { getPrismaClient } from "@/lib/prisma";
import {
  createWorkspaceApiAccessErrorResponse,
  resolveWorkspaceApiAccess,
} from "@/lib/auth/workspace-api-access";
import { NextResponse } from "next/server";
import { z } from "zod";

const recommendationsRequestSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = recommendationsRequestSchema.parse(body);
  let trustedWorkspaceId: string;

  try {
    const access = await resolveWorkspaceApiAccess(input.workspaceId);
    trustedWorkspaceId = access.workspaceId;
  } catch (error) {
    const authErrorResponse = createWorkspaceApiAccessErrorResponse(error);

    if (authErrorResponse) {
      return authErrorResponse;
    }

    throw error;
  }

  const prisma = getPrismaClient();
  const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
    where: { workspaceId: trustedWorkspaceId },
    orderBy: { createdAt: "desc" },
  });
  const blueprintJson =
    latestBlueprint &&
    typeof latestBlueprint.blueprintJson === "object" &&
    latestBlueprint.blueprintJson !== null
      ? latestBlueprint.blueprintJson
      : {};
  const signals = extractLearnSignalsFromBlueprint(
    blueprintJson as {
      priorityStack?: string[];
      riskWarnings?: string[];
      learnModuleKeys?: string[];
    },
  );

  return NextResponse.json(resolveLearnRecommendations(signals));
}
