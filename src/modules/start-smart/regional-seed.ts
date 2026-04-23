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
  "jp-13": {
    housing: {
      monthly: 1700,
      confidence: "estimated",
      explanation: "Seeded baseline for Tokyo housing costs.",
    },
    utilities: {
      monthly: 120,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Tokyo households.",
    },
    transport: {
      monthly: 140,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Tokyo rail-heavy commuting.",
    },
    insurance: {
      monthly: 95,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Tokyo users.",
    },
  },
  "kr-11": {
    housing: {
      monthly: 1600,
      confidence: "estimated",
      explanation: "Seeded baseline for Seoul housing costs.",
    },
    utilities: {
      monthly: 110,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Seoul households.",
    },
    transport: {
      monthly: 85,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Seoul transit usage.",
    },
    insurance: {
      monthly: 90,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Seoul users.",
    },
  },
  "sg-01": {
    housing: {
      monthly: 2200,
      confidence: "estimated",
      explanation: "Seeded baseline for Singapore housing costs.",
    },
    utilities: {
      monthly: 130,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Singapore households.",
    },
    transport: {
      monthly: 110,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Singapore transit usage.",
    },
    insurance: {
      monthly: 120,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Singapore users.",
    },
  },
  "th-10": {
    housing: {
      monthly: 650,
      confidence: "estimated",
      explanation: "Seeded baseline for Bangkok housing costs.",
    },
    utilities: {
      monthly: 75,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Bangkok households.",
    },
    transport: {
      monthly: 70,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Bangkok commuting.",
    },
    insurance: {
      monthly: 40,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Bangkok users.",
    },
  },
  "ph-00": {
    housing: {
      monthly: 600,
      confidence: "estimated",
      explanation: "Seeded baseline for Metro Manila housing costs.",
    },
    utilities: {
      monthly: 70,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Metro Manila households.",
    },
    transport: {
      monthly: 60,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Metro Manila commuting.",
    },
    insurance: {
      monthly: 35,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Metro Manila users.",
    },
  },
  "id-jk": {
    housing: {
      monthly: 720,
      confidence: "estimated",
      explanation: "Seeded baseline for Jakarta housing costs.",
    },
    utilities: {
      monthly: 65,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Jakarta households.",
    },
    transport: {
      monthly: 75,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Jakarta commuting.",
    },
    insurance: {
      monthly: 45,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Jakarta users.",
    },
  },
  "my-14": {
    housing: {
      monthly: 850,
      confidence: "estimated",
      explanation: "Seeded baseline for Kuala Lumpur housing costs.",
    },
    utilities: {
      monthly: 80,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Kuala Lumpur households.",
    },
    transport: {
      monthly: 90,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Kuala Lumpur commuting.",
    },
    insurance: {
      monthly: 55,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Kuala Lumpur users.",
    },
  },
  "vn-sg": {
    housing: {
      monthly: 700,
      confidence: "estimated",
      explanation: "Seeded baseline for Ho Chi Minh City housing costs.",
    },
    utilities: {
      monthly: 60,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Ho Chi Minh City households.",
    },
    transport: {
      monthly: 65,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Ho Chi Minh City commuting.",
    },
    insurance: {
      monthly: 40,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Ho Chi Minh City users.",
    },
  },
  "in-mh": {
    housing: {
      monthly: 1100,
      confidence: "estimated",
      explanation: "Seeded baseline for Maharashtra housing costs.",
    },
    utilities: {
      monthly: 70,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Maharashtra households.",
    },
    transport: {
      monthly: 85,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Mumbai-region commuting.",
    },
    insurance: {
      monthly: 50,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Maharashtra users.",
    },
  },
  "hk-hk": {
    housing: {
      monthly: 2400,
      confidence: "estimated",
      explanation: "Seeded baseline for Hong Kong housing costs.",
    },
    utilities: {
      monthly: 140,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Hong Kong households.",
    },
    transport: {
      monthly: 95,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Hong Kong transit usage.",
    },
    insurance: {
      monthly: 110,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Hong Kong users.",
    },
  },
  "tw-tpe": {
    housing: {
      monthly: 1500,
      confidence: "estimated",
      explanation: "Seeded baseline for Taipei housing costs.",
    },
    utilities: {
      monthly: 100,
      confidence: "estimated",
      explanation: "Seeded utilities baseline for Taipei households.",
    },
    transport: {
      monthly: 70,
      confidence: "estimated",
      explanation: "Seeded transport baseline for Taipei transit usage.",
    },
    insurance: {
      monthly: 80,
      confidence: "estimated",
      explanation: "Seeded insurance placeholder for Taipei users.",
    },
  },
};

export function getRegionalSeed(regionKey: string) {
  return regionalSeedCatalog[regionKey] ?? {};
}
