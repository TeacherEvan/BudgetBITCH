import { describe, expect, it } from "vitest";
import { normalizeUserJobPreference } from "@/modules/personalization/personalization-schema";
import { buildJobNotifications } from "./job-notification-engine";
import type { JobListing } from "./job-schema";

const seededJobs: JobListing[] = [
  {
    slug: "registered-nurse-care-coordinator",
    title: "Registered Nurse Care Coordinator",
    company: "Harbor Health",
    location: "Austin, TX",
    workplace: "hybrid",
    salaryMin: 72000,
    salaryMax: 88000,
    salaryLabel: "$72k-$88k",
    jobType: "full_time",
    industry: "healthcare_admin",
    experienceLevel: "mid",
    schedule: "daytime",
    benefits: ["healthcare", "pto", "retirement"],
    visaStatus: "unknown",
    postingAgeDays: 2,
    fitGoals: ["stabilize_schedule"],
    fitSignals: ["stabilize_schedule", "caregiving_friendly"],
    summary: "Licensed RN role coordinating care plans and follow-ups.",
  },
  {
    slug: "kindergarten-classroom-teacher",
    title: "Kindergarten Classroom Teacher",
    company: "Bright Trail Academy",
    location: "Austin, TX",
    workplace: "on_site",
    salaryMin: 48000,
    salaryMax: 60000,
    salaryLabel: "$48k-$60k",
    jobType: "full_time",
    industry: "operations",
    experienceLevel: "entry",
    schedule: "daytime",
    benefits: ["healthcare", "pto"],
    visaStatus: "unknown",
    postingAgeDays: 3,
    fitGoals: ["stabilize_schedule", "build_new_career_path"],
    fitSignals: ["stabilize_schedule", "caregiving_friendly"],
    summary: "Lead early classroom routines and parent communication.",
  },
  {
    slug: "after-school-babysitter",
    title: "After-School Babysitter",
    company: "North Loop Family",
    location: "Austin, TX",
    workplace: "on_site",
    salaryMin: 18000,
    salaryMax: 26000,
    salaryLabel: "$18k-$26k",
    jobType: "part_time",
    industry: "support",
    experienceLevel: "entry",
    schedule: "evening",
    benefits: ["pto"],
    visaStatus: "unknown",
    postingAgeDays: 1,
    fitGoals: ["raise_income_fast"],
    fitSignals: ["flexible_hours", "caregiving_friendly", "second_job_friendly"],
    summary: "After-school pickup, snacks, and homework support.",
  },
  {
    slug: "local-dog-walker",
    title: "Local Dog Walker",
    company: "Paws Around Town",
    location: "Austin, TX",
    workplace: "on_site",
    salaryMin: 20000,
    salaryMax: 32000,
    salaryLabel: "$20k-$32k",
    jobType: "part_time",
    industry: "support",
    experienceLevel: "entry",
    schedule: "flexible",
    benefits: ["remote_stipend"],
    visaStatus: "unknown",
    postingAgeDays: 2,
    fitGoals: ["raise_income_fast"],
    fitSignals: ["flexible_hours", "second_job_friendly"],
    summary: "Neighborhood dog walking with flexible weekday rounds.",
  },
];

describe("buildJobNotifications", () => {
  it("matches nurse roles using qualifications and requested interests", () => {
    const preference = normalizeUserJobPreference({
      roleInterests: ["nurse"],
      certifications: ["RN", "CPR"],
      licenseTypes: ["registered_nurse"],
      nursingInterest: true,
    });

    const result = buildJobNotifications({
      preferences: preference,
      jobs: seededJobs,
    });

    expect(result.map((job) => job.slug)).toContain(
      "registered-nurse-care-coordinator",
    );
    expect(result[0]?.reasons).toContain("Matches your nursing credentials or stated interest.");
  });

  it("surfaces childcare and pet-care work from explicit interest signals", () => {
    const preference = normalizeUserJobPreference({
      roleInterests: ["babysitter", "dog walker"],
      certifications: [],
      licenseTypes: [],
      childCareInterest: true,
      petCareInterest: true,
    });

    const result = buildJobNotifications({
      preferences: preference,
      jobs: seededJobs,
    });

    expect(result.map((job) => job.slug)).toEqual([
      "after-school-babysitter",
      "local-dog-walker",
    ]);
  });

  it("does not require or infer gender for sensitive role alerts", () => {
    const preference = normalizeUserJobPreference({
      roleInterests: ["kindergarten teacher"],
      certifications: [],
      licenseTypes: ["state_teaching_license"],
      teachingInterest: true,
    });

    const result = buildJobNotifications({
      preferences: preference,
      jobs: seededJobs,
    });

    expect(result.map((job) => job.slug)).toContain("kindergarten-classroom-teacher");
    expect(result.every((job) => !job.reasons.some((reason) => /gender/i.test(reason)))).toBe(true);
  });
});