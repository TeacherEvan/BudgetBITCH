import type { RegionalBudgetCategory } from "./regional-seed";

export type RegionalTrustTier = "official" | "regulated" | "attributable";

export type RegionalSourceRecord = {
  sourceLabel: string;
  sourceUrl: string;
  trustTier: RegionalTrustTier;
  values: Partial<Record<RegionalBudgetCategory, { monthly: number }>>;
};

const curatedRegionalSources: Record<string, RegionalSourceRecord[]> = {
  "us-ca": [
    {
      sourceLabel: "California housing board",
      sourceUrl: "https://www.hcd.ca.gov/",
      trustTier: "official",
      values: {
        housing: { monthly: 2400 },
      },
    },
    {
      sourceLabel: "California energy market snapshot",
      sourceUrl: "https://www.energy.ca.gov/",
      trustTier: "official",
      values: {
        utilities: { monthly: 190 },
      },
    },
  ],
};

export async function fetchRegionalData(regionKey: string) {
  return curatedRegionalSources[regionKey] ?? [];
}
