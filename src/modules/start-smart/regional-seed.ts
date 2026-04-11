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

export type RegionalSeedSnapshot = Partial<Record<RegionalBudgetCategory, RegionalValue>>;

function cloneSeed(
  base: RegionalSeedSnapshot,
  overrides: RegionalSeedSnapshot,
): RegionalSeedSnapshot {
  return {
    ...base,
    ...overrides,
  };
}

const californiaSeed: RegionalSeedSnapshot = {
  housing: {
    monthly: 2100,
    confidence: "estimated",
    explanation: "Seeded baseline for California housing costs when live data is unavailable.",
  },
  utilities: {
    monthly: 180,
    confidence: "estimated",
    explanation: "Seeded utilities baseline for an average California household.",
  },
  transport: {
    monthly: 250,
    confidence: "estimated",
    explanation: "Seeded transport baseline based on mixed public transit and fuel costs.",
  },
  childcare: {
    monthly: 900,
    confidence: "estimated",
    explanation: "Seeded childcare placeholder for California family planning scenarios.",
  },
  insurance: {
    monthly: 190,
    confidence: "estimated",
    explanation: "Seeded insurance baseline used until a curated source is available.",
  },
};

const newYorkSeed: RegionalSeedSnapshot = {
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
};

const texasSeed: RegionalSeedSnapshot = {
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
};

const beijingSeed: RegionalSeedSnapshot = {
  housing: {
    monthly: 2600,
    confidence: "estimated",
    explanation: "Seeded baseline for Beijing housing costs.",
  },
  utilities: {
    monthly: 160,
    confidence: "estimated",
    explanation: "Seeded utilities baseline for Beijing households.",
  },
  transport: {
    monthly: 210,
    confidence: "estimated",
    explanation: "Seeded transport baseline for Beijing transit-heavy households.",
  },
  insurance: {
    monthly: 120,
    confidence: "estimated",
    explanation: "Seeded insurance placeholder for Beijing users.",
  },
};

const shanghaiSeed: RegionalSeedSnapshot = {
  housing: {
    monthly: 2750,
    confidence: "estimated",
    explanation: "Seeded baseline for Shanghai housing costs.",
  },
  utilities: {
    monthly: 165,
    confidence: "estimated",
    explanation: "Seeded utilities baseline for Shanghai households.",
  },
  transport: {
    monthly: 220,
    confidence: "estimated",
    explanation: "Seeded transport baseline for Shanghai transit-heavy households.",
  },
  insurance: {
    monthly: 125,
    confidence: "estimated",
    explanation: "Seeded insurance placeholder for Shanghai users.",
  },
};

const guangdongSeed: RegionalSeedSnapshot = {
  housing: {
    monthly: 1800,
    confidence: "estimated",
    explanation: "Seeded baseline for Guangdong housing costs.",
  },
  utilities: {
    monthly: 150,
    confidence: "estimated",
    explanation: "Seeded utilities baseline for Guangdong households.",
  },
  transport: {
    monthly: 240,
    confidence: "estimated",
    explanation: "Seeded transport baseline for Guangdong households.",
  },
  insurance: {
    monthly: 115,
    confidence: "estimated",
    explanation: "Seeded insurance placeholder for Guangdong users.",
  },
};

export const regionalSeedCatalog: Record<string, RegionalSeedSnapshot> = {
  "us-ca": californiaSeed,
  "us-ca-los-angeles": cloneSeed(californiaSeed, {
    housing: {
      monthly: 2550,
      confidence: "estimated",
      explanation: "Seeded Los Angeles baseline with higher rent pressure than the broader California profile.",
    },
    transport: {
      monthly: 315,
      confidence: "estimated",
      explanation: "Seeded Los Angeles transport baseline with a higher car and parking burden.",
    },
  }),
  "us-ca-san-francisco": cloneSeed(californiaSeed, {
    housing: {
      monthly: 2900,
      confidence: "estimated",
      explanation: "Seeded San Francisco baseline with higher rent pressure than the broader California profile.",
    },
    transport: {
      monthly: 280,
      confidence: "estimated",
      explanation: "Seeded San Francisco transport baseline with transit-heavy assumptions.",
    },
  }),
  "us-ny": newYorkSeed,
  "us-ny-new-york-city": cloneSeed(newYorkSeed, {
    housing: {
      monthly: 3200,
      confidence: "estimated",
      explanation: "Seeded New York City baseline with higher rent pressure than the broader New York profile.",
    },
    transport: {
      monthly: 260,
      confidence: "estimated",
      explanation: "Seeded New York City transport baseline with transit-heavy assumptions.",
    },
  }),
  "us-tx": texasSeed,
  "us-tx-houston": cloneSeed(texasSeed, {
    housing: {
      monthly: 1750,
      confidence: "estimated",
      explanation: "Seeded Houston baseline with slightly higher housing pressure than the broader Texas profile.",
    },
    transport: {
      monthly: 305,
      confidence: "estimated",
      explanation: "Seeded Houston transport baseline with heavier driving assumptions.",
    },
  }),
  "us-tx-austin": cloneSeed(texasSeed, {
    housing: {
      monthly: 1900,
      confidence: "estimated",
      explanation: "Seeded Austin baseline with stronger housing pressure than the broader Texas profile.",
    },
    transport: {
      monthly: 285,
      confidence: "estimated",
      explanation: "Seeded Austin transport baseline with a lighter driving burden than Houston.",
    },
  }),
  "cn-bj": beijingSeed,
  "cn-bj-beijing": cloneSeed(beijingSeed, {
    housing: {
      monthly: 2700,
      confidence: "estimated",
      explanation: "Seeded Beijing city baseline with a tighter housing market than the broader Beijing profile.",
    },
  }),
  "cn-sh": shanghaiSeed,
  "cn-sh-shanghai": cloneSeed(shanghaiSeed, {
    housing: {
      monthly: 2850,
      confidence: "estimated",
      explanation: "Seeded Shanghai city baseline with a tighter housing market than the broader Shanghai profile.",
    },
  }),
  "cn-gd": guangdongSeed,
  "cn-gd-guangzhou": cloneSeed(guangdongSeed, {
    housing: {
      monthly: 1950,
      confidence: "estimated",
      explanation: "Seeded Guangzhou baseline with a tighter housing market than the broader Guangdong profile.",
    },
  }),
  "cn-gd-shenzhen": cloneSeed(guangdongSeed, {
    housing: {
      monthly: 2250,
      confidence: "estimated",
      explanation: "Seeded Shenzhen baseline with a tighter housing market than the broader Guangdong profile.",
    },
    transport: {
      monthly: 255,
      confidence: "estimated",
      explanation: "Seeded Shenzhen transport baseline with a metro-friendly assumptions mix.",
    },
  }),
};

function getProvinceKey(regionKey: string) {
  const parts = regionKey.trim().toLowerCase().split("-");

  if (parts.length < 2) {
    return regionKey.trim().toLowerCase();
  }

  return parts.slice(0, 2).join("-");
}

export function getRegionalSeed(regionKey: string) {
  const normalizedKey = regionKey.trim().toLowerCase();
  const provinceKey = getProvinceKey(normalizedKey);

  return regionalSeedCatalog[normalizedKey] ?? regionalSeedCatalog[provinceKey] ?? {};
}
