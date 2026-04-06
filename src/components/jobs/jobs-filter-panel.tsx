import type { JobSearchFilters } from "@/modules/jobs/job-schema";
import { JobFitBadge } from "./job-fit-badge";

type JobsFilterPanelProps = {
  filters: JobSearchFilters;
};

export function JobsFilterPanel({ filters }: JobsFilterPanelProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-white/5 p-6 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">
        Practical filters
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
            Workplace
          </p>
          <p className="mt-2 text-sm text-emerald-50/85">
            {filters.workplace ?? "Any"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
            Salary floor
          </p>
          <p className="mt-2 text-sm text-emerald-50/85">
            {typeof filters.salaryMin === "number" ? `$${filters.salaryMin.toLocaleString()}` : "Any"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.fitGoals.map((goal) => (
          <JobFitBadge key={goal} label={goal} />
        ))}
      </div>
    </section>
  );
}
