import { getPrismaClient } from "@/lib/prisma";
import { extractJobSignalsFromBlueprint } from "@/modules/jobs/blueprint-bridge";
import { listJobs } from "@/modules/jobs/job-catalog";
import { scoreJobsForBlueprint } from "@/modules/jobs/job-fit-engine";
import { NextResponse } from "next/server";
import { z } from "zod";

const jobsRecommendationsRequestSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = jobsRecommendationsRequestSchema.parse(body);
  const prisma = getPrismaClient();
  const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
    where: { workspaceId: input.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const blueprintJson =
    latestBlueprint &&
    typeof latestBlueprint.blueprintJson === "object" &&
    latestBlueprint.blueprintJson !== null
      ? latestBlueprint.blueprintJson
      : {};
  const blueprintSignals = extractJobSignalsFromBlueprint(
    blueprintJson as {
      priorityStack?: string[];
      riskWarnings?: string[];
      learnModuleKeys?: string[];
    },
  );
  const jobs = scoreJobsForBlueprint({
    blueprint: {
      priorityStack: blueprintSignals.priorityStack,
      riskWarnings: blueprintSignals.riskWarnings,
    },
    jobs: listJobs(),
  });

  return NextResponse.json({ jobs });
}
