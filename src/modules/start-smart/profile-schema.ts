import { z } from "zod";
import {
  buildLocationKey,
  buildRegionKey,
  isSupportedCityCode,
  isSupportedCountryCode,
  isSupportedProvinceCode,
} from "./location-catalog";

const goalSchema = z.enum([
  "emergency_fund",
  "debt_relief",
  "stabilize_cash_flow",
  "build_investing_habit",
  "protect_benefits",
  "grow_income",
]);

const providerPreferenceSchema = z.enum([
  "claude",
  "openai",
  "copilot",
  "openclaw",
]);

export const startSmartProfileSchema = z
  .object({
    countryCode: z.string().trim().length(2, "Select a country."),
    stateCode: z.string().trim().min(2, "Select a province or state.").max(64, "Select a province or state."),
    cityCode: z.string().trim().max(64).optional(),
    ageBand: z.enum(["single_teen", "young_adult", "adult", "retiree"]),
    housing: z.enum([
      "living_with_family",
      "renting",
      "owning",
      "temporary",
      "housing_insecure",
    ]),
    adults: z.number().int().min(1).default(1),
    dependents: z.number().int().min(0),
    pets: z.number().int().min(0),
    incomePattern: z.enum(["steady", "variable", "seasonal", "none"]),
    debtLoad: z.enum(["none", "low", "moderate", "high"]),
    goals: z.array(goalSchema).min(1),
    benefitsSupport: z.array(z.string()).default([]),
    preferredIntegrations: z.array(providerPreferenceSchema).default([]),
  })
  .superRefine((profile, ctx) => {
    const countryCode = profile.countryCode.trim().toUpperCase();
    const stateCode = profile.stateCode.trim().toUpperCase();
    const cityCode = profile.cityCode?.trim();

    if (!isSupportedCountryCode(countryCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["countryCode"],
        message: "Select a supported country.",
      });
      return;
    }

    if (!isSupportedProvinceCode(countryCode, stateCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stateCode"],
        message: "Select a province or state for the selected country.",
      });
      return;
    }

    if (cityCode && !isSupportedCityCode(countryCode, stateCode, cityCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cityCode"],
        message: "Select a supported city for the selected province.",
      });
    }
  });

export type StartSmartProfileInput = z.input<typeof startSmartProfileSchema>;
export type StartSmartProfile = z.infer<typeof startSmartProfileSchema>;

export type StartSmartRiskSignal =
  | "income_volatility"
  | "debt_pressure"
  | "dependent_costs"
  | "pet_costs"
  | "housing_instability"
  | "benefits_dependency";

export type StartSmartPriorityBias =
  | "stability"
  | "debt_relief"
  | "safety_net"
  | "income_growth";

export function normalizeStartSmartProfile(input: StartSmartProfileInput) {
  const profile = startSmartProfileSchema.parse(input);
  const countryCode = profile.countryCode.trim().toUpperCase();
  const stateCode = profile.stateCode.trim().toUpperCase();
  const cityCode = profile.cityCode?.trim().toLowerCase() || "";
  const regionKey = buildRegionKey(countryCode, stateCode);
  const locationKey = buildLocationKey(countryCode, stateCode, cityCode);
  const riskSignals: StartSmartRiskSignal[] = [];

  if (profile.incomePattern === "variable" || profile.incomePattern === "seasonal") {
    riskSignals.push("income_volatility");
  }

  if (profile.debtLoad === "moderate" || profile.debtLoad === "high") {
    riskSignals.push("debt_pressure");
  }

  if (profile.dependents > 0) {
    riskSignals.push("dependent_costs");
  }

  if (profile.pets > 0) {
    riskSignals.push("pet_costs");
  }

  if (profile.housing === "temporary" || profile.housing === "housing_insecure") {
    riskSignals.push("housing_instability");
  }

  if (profile.benefitsSupport.some((entry) => entry !== "none")) {
    riskSignals.push("benefits_dependency");
  }

  const householdKind =
    profile.adults > 1 ? (profile.dependents > 0 ? "family" : "couple") : "solo";

  const priorityBias: StartSmartPriorityBias[] = [];

  if (riskSignals.includes("income_volatility") || riskSignals.includes("housing_instability")) {
    priorityBias.push("stability");
  }

  if (profile.goals.includes("debt_relief") || riskSignals.includes("debt_pressure")) {
    priorityBias.push("debt_relief");
  }

  if (profile.goals.includes("emergency_fund")) {
    priorityBias.push("safety_net");
  }

  if (profile.goals.includes("grow_income")) {
    priorityBias.push("income_growth");
  }

  return {
    ...profile,
    countryCode,
    stateCode,
    cityCode,
    regionKey,
    locationKey,
    householdKind,
    riskSignals,
    priorityBias,
  };
}
