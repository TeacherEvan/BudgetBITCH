import { describe, expect, it } from "vitest";
import { jobSearchFiltersSchema } from "./job-schema";

describe("jobSearchFiltersSchema", () => {
  it("accepts the practical job filter set from the design", () => {
    const result = jobSearchFiltersSchema.parse({
      title: "Customer Support",
      keyword: "remote",
      company: "Northstar",
      location: "Austin, TX",
      workplace: "remote",
      salaryMin: 45000,
      salaryMax: 70000,
      jobType: "full_time",
      industry: "support",
      experienceLevel: "entry",
      schedule: "daytime",
      benefits: ["healthcare"],
      visaStatus: "no_sponsorship_needed",
      postingAgeDays: 7,
      fitGoals: ["raise_income_fast", "stabilize_schedule"],
    });

    expect(result.workplace).toBe("remote");
    expect(result.fitGoals).toContain("raise_income_fast");
  });
});
