export type ConfidenceLabel = "verified" | "estimated" | "user_entered";

export type RegionalBudgetCategory =
  | "housing"
  | "utilities"
  | "transport"
  | "childcare"
  | "insurance";

export type RegionalValue = {
  monthly: number;
  confidence: ConfidenceLabel;
  sourceUrl?: string;
  fetchedAt?: string;
  explanation?: string;
};

export type RegionalSeedSnapshot = Partial<
  Record<RegionalBudgetCategory, RegionalValue>
>;

export const regionalSeedCatalog: Record<string, RegionalSeedSnapshot> = {
  "us-ca": {
    housing: {
      monthly: 2100,
      confidence: "estimated",
      explanation:
        "Seeded baseline for California housing costs when live data is unavailable.",
    },
    utilities: {
      monthly: 180,
      confidence: "estimated",
      explanation:
        "Seeded utilities baseline for an average California household.",
    },
    transport: {
      monthly: 250,
      confidence: "estimated",
      explanation:
        "Seeded transport baseline based on mixed public transit and fuel costs.",
    },
    childcare: {
      monthly: 900,
      confidence: "estimated",
      explanation:
        "Seeded childcare placeholder for California family planning scenarios.",
    },
    insurance: {
      monthly: 190,
      confidence: "estimated",
      explanation:
        "Seeded insurance baseline used until a curated source is available.",
    },
  },
  "us-tx": {
    housing: {
      monthly: 1550,
      confidence: "estimated",
      explanation: "Seeded baseline for Texas housing costs.",
    },
    utilities: {
      monthly: 165,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Texas households.",
    },
    transport: {
      monthly: 290,
      confidence: "estimated",
      explanation: "Seeded transport baseline with higher car dependence.",
    },
    insurance: {
      monthly: 170,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Texas users.",
    },
  },
  "us-ny": {
    housing: {
      monthly: 2300,
      confidence: "estimated",
      explanation: "Seeded baseline for New York housing costs.",
    },
    utilities: {
      monthly: 175,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for New York households.",
    },
    transport: {
      monthly: 220,
      confidence: "estimated",
      explanation: "Seeded transport baseline reflecting heavier transit use.",
    },
    insurance: {
      monthly: 205,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for New York users.",
    },
  },
};

export function getRegionalSeed(regionKey: string) {
  return regionalSeedCatalog[regionKey] ?? {};
}
