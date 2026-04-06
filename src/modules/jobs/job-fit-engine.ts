import type { JobListing } from "./job-schema";

type BlueprintJobInput = {
  priorityStack: string[];
  riskWarnings: string[];
};

function averageSalary(job: JobListing) {
  return Math.round((job.salaryMin + job.salaryMax) / 2);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function buildFitSummary(signals: string[]) {
  const ordered = unique(signals).map((signal) => signal.replaceAll("_", " "));

  if (ordered.length === 0) {
    return "Strong fit based on your blueprint.";
  }

  return `Strong fit to ${ordered.join(" and ")}.`;
}

export function scoreJobsForBlueprint(input: {
  blueprint: BlueprintJobInput;
  jobs: JobListing[];
}) {
  return [...input.jobs]
    .map((job) => {
      let score = averageSalary(job) / 1000;
      const fitSummarySignals: string[] = [];

      if (input.blueprint.priorityStack.includes("stabilize_cash_flow")) {
        if (job.fitSignals.includes("stabilize_schedule")) {
          score += 20;
          fitSummarySignals.push("stabilize_schedule");
        }

        if (job.workplace === "remote" || job.schedule === "daytime") {
          score += 10;
        }
      }

      if (
        input.blueprint.priorityStack.includes("build_new_career_path") &&
        job.fitSignals.includes("build_new_career_path")
      ) {
        score += 15;
        fitSummarySignals.push("build_new_career_path");
      }

      if (
        input.blueprint.priorityStack.includes("cover_essentials") ||
        input.blueprint.riskWarnings.includes("income_volatility_risk")
      ) {
        if (job.fitSignals.includes("raise_income_fast")) {
          score += 18;
          fitSummarySignals.push("raise_income_fast");
        }
      }

      if (
        fitSummarySignals.length === 0 &&
        job.fitSignals.includes("second_job_friendly")
      ) {
        fitSummarySignals.push("second_job_friendly");
      }

      return {
        ...job,
        score,
        fitSummary: buildFitSummary(fitSummarySignals),
      };
    })
    .sort((left, right) => right.score - left.score);
}
