import { getPrismaClient } from "@/lib/prisma";

export type LatestBlueprintSummary = {
  priorityStack: string[];
  riskWarnings: string[];
  next7Days: string[];
  learnModuleKeys: string[];
};

export type LatestBlueprintSignals = LatestBlueprintSummary;

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function parseLatestBlueprintSignals(value: unknown): LatestBlueprintSignals | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const blueprintJson = value as Record<string, unknown>;
  const signals = {
    priorityStack: normalizeStringArray(blueprintJson.priorityStack),
    riskWarnings: normalizeStringArray(blueprintJson.riskWarnings),
    next7Days: normalizeStringArray(blueprintJson.next7Days),
    learnModuleKeys: normalizeStringArray(blueprintJson.learnModuleKeys),
  } satisfies LatestBlueprintSignals;

  const hasUsableSignals = Object.values(signals).some((entries) => entries.length > 0);

  return hasUsableSignals ? signals : null;
}

function parseLatestBlueprintSummary(value: unknown): LatestBlueprintSummary | null {
  const signals = parseLatestBlueprintSignals(value);

  if (!signals) {
    return null;
  }

  const hasMeaningfulSummary =
    signals.priorityStack.length > 0 &&
    signals.next7Days.length > 0 &&
    signals.learnModuleKeys.length > 0;

  return hasMeaningfulSummary ? signals : null;
}

function buildLatestBlueprintQuery(workspaceId: string) {
  return {
    where: {
      workspaceId,
      status: "generated" as const,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
    select: {
      blueprintJson: true,
    },
  };
}

export async function getLatestBlueprintForWorkspace(
  workspaceId: string,
): Promise<LatestBlueprintSummary | null> {
  const prisma = getPrismaClient();
  const latestBlueprintQuery = buildLatestBlueprintQuery(workspaceId);
  const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst(latestBlueprintQuery);

  if (!latestBlueprint) {
    return null;
  }

  return parseLatestBlueprintSummary(latestBlueprint.blueprintJson);
}

export async function getLatestBlueprintSignalsForWorkspace(
  workspaceId: string,
): Promise<LatestBlueprintSignals | null> {
  const prisma = getPrismaClient();
  const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst(
    buildLatestBlueprintQuery(workspaceId),
  );

  if (!latestBlueprint) {
    return null;
  }

  return parseLatestBlueprintSignals(latestBlueprint.blueprintJson);
}