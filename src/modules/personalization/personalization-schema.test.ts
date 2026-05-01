import { describe, expect, it } from "vitest";
import {
  normalizePersonalizationProfile,
  normalizeUserJobPreference,
} from "./personalization-schema";

describe("normalizePersonalizationProfile", () => {
  it("keeps personalization optional while preserving explicit consented identity settings", () => {
    const result = normalizePersonalizationProfile({
      genderIdentity: "woman",
      pronouns: "she_her",
      communicationStyle: "direct",
      coachingIntensity: "focused",
      consented: true,
    });

    expect(result.genderIdentity).toBe("woman");
    expect(result.pronouns).toBe("she_her");
    expect(result.communicationStyle).toBe("direct");
    expect(result.consented).toBe(true);
  });

  it("accepts prefer-not-to-say without forcing self-description", () => {
    const result = normalizePersonalizationProfile({
      genderIdentity: "prefer_not_to_say",
      pronouns: "prefer_not_to_say",
      consented: false,
    });

    expect(result.genderIdentity).toBe("prefer_not_to_say");
    expect(result.genderSelfDescription).toBeUndefined();
    expect(result.pronounSelfDescription).toBeUndefined();
  });

  it("rejects self-describe values when the companion text is missing", () => {
    expect(() =>
      normalizePersonalizationProfile({
        genderIdentity: "self_describe",
        pronouns: "they_them",
        consented: true,
      }),
    ).toThrow(/describe/i);
  });
});

describe("normalizeUserJobPreference", () => {
  it("normalizes role interests and qualification-based alerts without using gender", () => {
    const result = normalizeUserJobPreference({
      roleInterests: ["nurse", "kindergarten teacher", "dog walker"],
      certifications: ["RN", "CPR"],
      licenseTypes: ["state_teaching_license"],
      careWorkInterest: true,
      childCareInterest: true,
      petCareInterest: true,
      notificationEnabled: true,
    });

    expect(result.roleInterests).toEqual([
      "nurse",
      "kindergarten teacher",
      "dog walker",
    ]);
    expect(result.certifications).toContain("RN");
    expect(result.notificationEnabled).toBe(true);
  });

  it("deduplicates case-insensitive role interests and trims whitespace", () => {
    const result = normalizeUserJobPreference({
      roleInterests: [" Nurse ", "nurse", "DOG WALKER", "dog walker"],
      certifications: [],
      licenseTypes: [],
    });

    expect(result.roleInterests).toEqual(["nurse", "dog walker"]);
  });
});