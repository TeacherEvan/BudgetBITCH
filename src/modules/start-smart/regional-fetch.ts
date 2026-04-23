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
  "jp-13": [
    {
      sourceLabel: "Tokyo Metropolitan Government cost snapshot",
      sourceUrl: "https://www.metro.tokyo.lg.jp/",
      trustTier: "official",
      values: {
        housing: { monthly: 1850 },
        transport: { monthly: 165 },
      },
    },
  ],
  "kr-11": [
    {
      sourceLabel: "Seoul Metropolitan Government cost snapshot",
      sourceUrl: "https://english.seoul.go.kr/",
      trustTier: "official",
      values: {
        housing: { monthly: 1750 },
        transport: { monthly: 95 },
      },
    },
  ],
  "sg-01": [
    {
      sourceLabel: "Singapore Department of Statistics housing snapshot",
      sourceUrl: "https://www.singstat.gov.sg/",
      trustTier: "official",
      values: {
        housing: { monthly: 2350 },
        utilities: { monthly: 145 },
      },
    },
  ],
  "th-10": [
    {
      sourceLabel: "Bangkok Metropolitan Administration cost snapshot",
      sourceUrl: "https://www.bangkok.go.th/",
      trustTier: "official",
      values: {
        housing: { monthly: 720 },
        transport: { monthly: 90 },
      },
    },
  ],
  "ph-00": [
    {
      sourceLabel: "Philippine Statistics Authority household snapshot",
      sourceUrl: "https://psa.gov.ph/",
      trustTier: "official",
      values: {
        housing: { monthly: 680 },
        utilities: { monthly: 85 },
      },
    },
  ],
  "id-jk": [
    {
      sourceLabel: "Jakarta provincial living-cost snapshot",
      sourceUrl: "https://jakarta.go.id/",
      trustTier: "official",
      values: {
        housing: { monthly: 830 },
        transport: { monthly: 100 },
      },
    },
  ],
  "my-14": [
    {
      sourceLabel: "Malaysia statistics household snapshot",
      sourceUrl: "https://www.dosm.gov.my/portal-main/home",
      trustTier: "official",
      values: {
        housing: { monthly: 900 },
        transport: { monthly: 120 },
      },
    },
  ],
  "vn-sg": [
    {
      sourceLabel: "Ho Chi Minh City household cost snapshot",
      sourceUrl: "https://hochiminhcity.gov.vn/",
      trustTier: "official",
      values: {
        housing: { monthly: 760 },
        transport: { monthly: 95 },
      },
    },
  ],
  "in-mh": [
    {
      sourceLabel: "Maharashtra household cost snapshot",
      sourceUrl: "https://www.maharashtra.gov.in/",
      trustTier: "official",
      values: {
        housing: { monthly: 1450 },
        transport: { monthly: 110 },
      },
    },
  ],
  "hk-hk": [
    {
      sourceLabel: "Hong Kong Census and Statistics household snapshot",
      sourceUrl: "https://www.censtatd.gov.hk/",
      trustTier: "official",
      values: {
        housing: { monthly: 2600 },
        utilities: { monthly: 160 },
      },
    },
  ],
  "tw-tpe": [
    {
      sourceLabel: "Taipei City Government household snapshot",
      sourceUrl: "https://english.gov.taipei/",
      trustTier: "official",
      values: {
        housing: { monthly: 1700 },
        transport: { monthly: 85 },
      },
    },
  ],
};

export async function fetchRegionalData(regionKey: string) {
  return curatedRegionalSources[regionKey] ?? [];
}
