import type { JobSearchFilters } from "@/modules/jobs/job-schema";
import { HomeLocationCard } from "@/components/home-location/home-location-card";
import { DollarSign, Filter, MapPin, Sparkles, type LucideIcon } from "lucide-react";
import { JobFitBadge } from "./job-fit-badge";

type JobsFilterPanelProps = {
  filters: JobSearchFilters;
  jobCount: number;
  laneCount: number;
};

type SummaryChip = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function JobsFilterPanel({ filters, jobCount, laneCount }: JobsFilterPanelProps) {
  const summaryChips: SummaryChip[] = [
    {
      label: "Workplace",
      value: filters.workplace ?? "Any",
      icon: MapPin,
    },
    {
      label: "Salary floor",
      value:
        typeof filters.salaryMin === "number" ? `$${filters.salaryMin.toLocaleString()}` : "Any",
      icon: DollarSign,
    },
    {
      label: "Route style",
      value: laneCount === 1 ? "1 lane live" : `${laneCount} lanes live`,
      icon: Filter,
    },
  ];

  return (
    <section
      aria-labelledby="jobs-filter-summary"
      className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white"
    >
      <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Route brief</p>
      <h2 id="jobs-filter-summary" className="mt-2 text-xl font-semibold text-white">
        Compact filter summary
      </h2>
      <p className="mt-2 text-sm text-emerald-50/75">
        Keep the board tight: remote-first, salary-floor guarded, and matched to the two most
        urgent blueprint goals.
      </p>

      <div className="mt-5 grid gap-3">
        {summaryChips.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          >
            <span className="rounded-xl border border-white/10 bg-white/10 p-2 text-emerald-100">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/65">{label}</p>
              <p className="mt-1 text-sm font-medium text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-100/70">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Priority fit
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.fitGoals.map((goal) => (
            <JobFitBadge key={goal} label={goal} />
          ))}
        </div>
      </div>

      <HomeLocationCard
        kicker="Home base"
        title="Sticky home location"
        description="Jobs can now reuse the same saved home base that Start Smart and dashboard read."
        emptyStateCopy="No home base saved yet. Set one in Start Smart so regional job cues have one shared anchor."
        actionHref="/start-smart"
        actionLabel="Open setup wizard"
        className="mt-5 p-4"
      />

      <p className="mt-5 text-sm text-emerald-50/75">
        {jobCount} seeded matches are already sorted into fast-scan recommendation lanes.
      </p>
    </section>
  );
}
