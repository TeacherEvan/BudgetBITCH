import { describe, expect, it } from "vitest";
import { getJobBySlug, listJobs } from "./job-catalog";

describe("job-catalog", () => {
  it("contains practical seeded listings with fit metadata", () => {
    const jobs = listJobs();

    expect(
      jobs.some((job) => job.slug === "remote-customer-support-specialist"),
    ).toBe(true);
    expect(
      jobs.some((job) => job.slug === "evening-medical-billing-coordinator"),
    ).toBe(true);
    expect(
      jobs.some((job) => job.slug === "junior-payroll-operations-analyst"),
    ).toBe(true);
  });

  it("supports lookup by slug", () => {
    expect(getJobBySlug("remote-customer-support-specialist")?.company).toBe(
      "Northstar",
    );
  });
});
