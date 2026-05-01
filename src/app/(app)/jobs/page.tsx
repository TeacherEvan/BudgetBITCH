import { JobCard } from "@/components/jobs/job-card";
import { JobsFilterPanel } from "@/components/jobs/jobs-filter-panel";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import type { JobSearchFilters } from "@/modules/jobs/job-schema";
import { listRecommendedJobs, type RecommendedJob } from "@/modules/jobs/recommended-jobs";
import { Clock3, Compass, Rocket, Sparkles, type LucideIcon } from "lucide-react";

const defaultFilters: JobSearchFilters = {
  workplace: "remote",
  salaryMin: 45000,
  benefits: [],
  fitGoals: ["raise_income_fast", "stabilize_schedule"],
};

type JobLaneDefinition = {
  key: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  matches: (job: RecommendedJob) => boolean;
};

const jobLaneDefinitions: JobLaneDefinition[] = [
  {
    key: "build_new_career_path",
    title: "Career pivot lane",
    summary: "Cleaner systems experience with room to move up.",
    icon: Compass,
    matches: (job) => job.fitGoals.includes("build_new_career_path"),
  },
  {
    key: "raise_income_fast",
    title: "Fast cash lane",
    summary: "Faster pay bumps and low-friction extra income.",
    icon: Rocket,
    matches: (job) => job.fitGoals.includes("raise_income_fast"),
  },
  {
    key: "stabilize_schedule",
    title: "Steady routine lane",
    summary: "Predictable hours with fewer schedule swings.",
    icon: Clock3,
    matches: (job) => job.fitGoals.includes("stabilize_schedule"),
  },
];

function groupJobsIntoLanes(recommendedJobs: RecommendedJob[]) {
  const assignedJobs = new Set<string>();

  const lanes = jobLaneDefinitions
    .map((lane) => {
      const jobs = recommendedJobs.filter((job) => {
        if (assignedJobs.has(job.slug) || !lane.matches(job)) {
          return false;
        }

        assignedJobs.add(job.slug);
        return true;
      });

      return { ...lane, jobs };
    })
    .filter((lane) => lane.jobs.length > 0);

  const overflowJobs = recommendedJobs.filter((job) => !assignedJobs.has(job.slug));

  if (overflowJobs.length > 0) {
    lanes.push({
      key: "wildcard_lane",
      title: "Wildcard lane",
      summary: "Useful backups that still fit the blueprint even without a clean label.",
      icon: Sparkles,
      matches: () => false,
      jobs: overflowJobs,
    });
  }

  return lanes;
}

export default async function JobsPage() {
  const recommendedJobs = await listRecommendedJobs();
  const jobLanes = groupJobsIntoLanes(recommendedJobs);
  const quickStats = [
    {
      label: "Active lanes",
      value: `${jobLanes.length}`,
      cue: "Relief routes live.",
    },
    {
      label: "Board preference",
      value: defaultFilters.workplace ?? "Any",
      cue: "Remote-first.",
    },
    {
      label: "Top board pay",
      value: recommendedJobs[0]?.salaryLabel ?? "Live",
      cue: "Top live salary.",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <MobilePanelFrame>
        <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Jobs</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Quick job routes for real-life pressure.
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-emerald-50/85 sm:text-base">
                  Scan by relief type, then open the full brief.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {quickStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[28px] border border-white/10 bg-white/6 p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-emerald-50/75">{stat.cue}</p>
              </article>
            ))}
          </div>
        </header>

        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <JobsFilterPanel
            filters={defaultFilters}
            jobCount={recommendedJobs.length}
            laneCount={jobLanes.length}
          />

          <section aria-labelledby="recommendation-board-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">
                  Scan by lane
                </p>
                <h2
                  id="recommendation-board-heading"
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  Quick route board
                </h2>
              </div>
              <p className="text-sm text-emerald-50/75">
                Each card lands in the first lane that helps fastest.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {jobLanes.map(({ key, title, summary, icon: Icon, jobs }) => (
                <section
                  key={key}
                  aria-labelledby={`${key}-heading`}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-2 text-emerald-100">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 id={`${key}-heading`} className="text-lg font-semibold text-white">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm text-emerald-50/75">{summary}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200">
                      {jobs.length} routes
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {jobs.map((job) => (
                      <JobCard
                        key={job.slug}
                        job={{
                          slug: job.slug,
                          title: job.title,
                          company: job.company,
                          location: job.location,
                          salaryLabel: job.salaryLabel,
                          hasSpecificFitCue: job.hasSpecificFitCue,
                          fitSummary: job.fitSummary,
                          summary: job.summary,
                          workplace: job.workplace,
                          schedule: job.schedule,
                          jobType: job.jobType,
                          postingAgeDays: job.postingAgeDays,
                          fitSignals: job.fitSignals,
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
        </section>
      </MobilePanelFrame>
    </main>
  );
}
