import { z } from "zod";

const genderIdentitySchema = z.enum([
  "woman",
  "man",
  "nonbinary",
  "self_describe",
  "prefer_not_to_say",
]);

const pronounPreferenceSchema = z.enum([
  "she_her",
  "he_him",
  "they_them",
  "name_only",
  "self_describe",
  "prefer_not_to_say",
]);

const communicationStyleSchema = z.enum(["gentle", "balanced", "direct"]);
const coachingIntensitySchema = z.enum(["light", "focused", "deep"]);

function optionalTrimmedString(maxLength: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );
}

export const personalizationProfileSchema = z
  .object({
    genderIdentity: genderIdentitySchema.optional(),
    genderSelfDescription: optionalTrimmedString(80),
    pronouns: pronounPreferenceSchema.optional(),
    pronounSelfDescription: optionalTrimmedString(80),
    communicationStyle: communicationStyleSchema.optional(),
    coachingIntensity: coachingIntensitySchema.optional(),
    consented: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.genderIdentity === "self_describe" && !value.genderSelfDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["genderSelfDescription"],
        message: "Describe your gender identity when self-describe is selected.",
      });
    }

    if (value.pronouns === "self_describe" && !value.pronounSelfDescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pronounSelfDescription"],
        message: "Describe your pronouns when self-describe is selected.",
      });
    }
  });

export const userJobPreferenceSchema = z.object({
  roleInterests: z.array(optionalTrimmedString(80)).default([]),
  certifications: z.array(optionalTrimmedString(80)).default([]),
  licenseTypes: z.array(optionalTrimmedString(80)).default([]),
  careWorkInterest: z.boolean().default(false),
  childCareInterest: z.boolean().default(false),
  petCareInterest: z.boolean().default(false),
  nursingInterest: z.boolean().default(false),
  teachingInterest: z.boolean().default(false),
  notificationEnabled: z.boolean().default(true),
});

export type PersonalizationProfile = z.infer<typeof personalizationProfileSchema>;
export type UserJobPreference = z.infer<typeof userJobPreferenceSchema>;

function normalizeStringList(
  values: Array<string | undefined>,
  normalizeValue: (value: string) => string = (value) => value.toLowerCase(),
  outputValue: (value: string, normalized: string) => string = (_value, normalized) => normalized,
) {
  const seen = new Set<string>();

  return values.reduce<string[]>((list, value) => {
    if (!value) {
      return list;
    }

    const trimmed = value.trim();
    const normalized = normalizeValue(trimmed);

    if (!normalized || seen.has(normalized)) {
      return list;
    }

    seen.add(normalized);
    list.push(outputValue(trimmed, normalized));
    return list;
  }, []);
}

export function normalizePersonalizationProfile(input: unknown) {
  return personalizationProfileSchema.parse(input);
}

export function normalizeUserJobPreference(input: unknown) {
  const parsed = userJobPreferenceSchema.parse(input);

  return {
    ...parsed,
    roleInterests: normalizeStringList(parsed.roleInterests),
    certifications: normalizeStringList(
      parsed.certifications,
      (value) => value.toUpperCase(),
      (value) => value,
    ),
    licenseTypes: normalizeStringList(parsed.licenseTypes),
  };
}