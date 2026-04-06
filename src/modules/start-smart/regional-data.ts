import type { RegionalSourceRecord, RegionalTrustTier } from "./regional-fetch";
import {
  getRegionalSeed,
  type ConfidenceLabel,
  type RegionalBudgetCategory,
  type RegionalSeedSnapshot,
  type RegionalValue,
} from "./regional-seed";

export type RegionalSnapshot = {
  regionKey: string;
  sources: Array<{
    sourceLabel: string;
    sourceUrl: string;
    trustTier: RegionalTrustTier;
  }>;
} & Partial<Record<RegionalBudgetCategory, RegionalValue>>;

type BuildRegionalSnapshotInput = {
  regionKey: string;
  seed?: RegionalSeedSnapshot;
  fetched?: RegionalSourceRecord[];
};

const trustScores: Record<RegionalTrustTier, number> = {
  official: 3,
  regulated: 2,
  attributable: 1,
};

export function rankTrustTier(trustTier: RegionalTrustTier) {
  return trustScores[trustTier];
}

function toConfidenceLabel(trustTier: RegionalTrustTier): ConfidenceLabel {
  return trustTier === "official" || trustTier === "regulated"
    ? "verified"
    : "estimated";
}

export function mergeRegionalValues(
  current: RegionalValue | undefined,
  incoming: { monthly: number },
  source: RegionalSourceRecord,
) {
  const incomingScore = rankTrustTier(source.trustTier);
  const currentScore =
    current?.confidence === "user_entered"
      ? 4
      : current?.confidence === "verified"
        ? 2
        : current
          ? 1
          : 0;

  if (current?.confidence === "user_entered") {
    return current;
  }

  if (current && currentScore > incomingScore) {
    return current;
  }

  return {
    monthly: incoming.monthly,
    confidence: toConfidenceLabel(source.trustTier),
    sourceUrl: source.sourceUrl,
    fetchedAt: new Date().toISOString(),
    explanation: `${source.sourceLabel} provided the most trusted value for this category.`,
  } satisfies RegionalValue;
}

export function buildRegionalSnapshot(
  input: BuildRegionalSnapshotInput,
): RegionalSnapshot {
  const seed = input.seed ?? getRegionalSeed(input.regionKey);
  const fetched = input.fetched ?? [];

  const snapshot: RegionalSnapshot = {
    regionKey: input.regionKey,
    sources: fetched.map((source) => ({
      sourceLabel: source.sourceLabel,
      sourceUrl: source.sourceUrl,
      trustTier: source.trustTier,
    })),
    ...seed,
  };

  for (const source of fetched) {
    for (const [category, value] of Object.entries(source.values) as Array<
      [RegionalBudgetCategory, { monthly: number }]
    >) {
      snapshot[category] = mergeRegionalValues(
        snapshot[category],
        value,
        source,
      );
    }
  }

  return snapshot;
}
