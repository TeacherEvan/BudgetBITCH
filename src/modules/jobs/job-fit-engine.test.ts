import { describe, expect, it } from "vitest";
import { scoreJobsForBlueprint } from "./job-fit-engine";

describe("scoreJobsForBlueprint", () => {
  it("ranks jobs for stabilization and income-growth needs", () => {
    const result = scoreJobsForBlueprint({
      blueprint: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["income_volatility_risk"],
      },
      jobs: [
        {
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          salaryMin: 48000,
          salaryMax: 62000,
          workplace: "remote",
          schedule: "daytime",
          fitSignals: ["stabilize_schedule", "raise_income_fast"],
        },
        {
          slug: "weekend-warehouse-loader",
          title: "Weekend Warehouse Loader",
          company: "BulkBird",
          salaryMin: 28000,
          salaryMax: 34000,
          workplace: "on_site",
          schedule: "weekend",
          fitSignals: ["second_job_friendly"],
        },
      ],
    });

    expect(result[0]?.slug).toBe("remote-customer-support-specialist");
    expect(result[0]?.fitSummary).toContain("stabilize schedule");
  });

  it("falls back to a generic summary when no fit signals match", () => {
    const result = scoreJobsForBlueprint({
      blueprint: {
        priorityStack: [],
        riskWarnings: [],
      },
      jobs: [
        {
          slug: "generalist-role",
          title: "Generalist Role",
          company: "Northstar",
          salaryMin: 40000,
          salaryMax: 50000,
          workplace: "remote",
          schedule: "daytime",
          fitSignals: [],
        },
      ],
    });

    expect(result[0]?.fitSummary).toBe("Strong fit based on your blueprint.");
  });
});
