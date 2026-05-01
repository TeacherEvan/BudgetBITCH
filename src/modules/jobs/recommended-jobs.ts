import { getPrismaClient } from "@/lib/prisma";
import { extractJobSignalsFromBlueprint } from "@/modules/jobs/blueprint-bridge";
import { listJobs } from "@/modules/jobs/job-catalog";
import { scoreJobsForBlueprint } from "@/modules/jobs/job-fit-engine";

function shouldUseSeededJobFallback(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "DATABASE_URL is not configured for Prisma runtime access." ||
      error.name.startsWith("PrismaClient"))
  );
}

export async function listRecommendedJobs() {
  try {
    const prisma = getPrismaClient();
    const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
      where: { workspaceId: "demo_workspace" },
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

    return scoreJobsForBlueprint({
      blueprint: {
        priorityStack: blueprintSignals.priorityStack,
        riskWarnings: blueprintSignals.riskWarnings,
      },
      jobs: listJobs(),
    });
  } catch (error) {
    if (shouldUseSeededJobFallback(error)) {
      return scoreJobsForBlueprint({
        blueprint: {
          priorityStack: ["cover_essentials", "stabilize_cash_flow"],
          riskWarnings: ["income_volatility_risk"],
        },
        jobs: listJobs(),
      });
    }

    throw error;
  }
}

export type RecommendedJob = Awaited<ReturnType<typeof listRecommendedJobs>>[number];