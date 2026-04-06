import { JobsFilterPanel } from "@/components/jobs/jobs-filter-panel";
import { JobCard } from "@/components/jobs/job-card";
import { getPrismaClient } from "@/lib/prisma";
import { extractJobSignalsFromBlueprint } from "@/modules/jobs/blueprint-bridge";
import { listJobs } from "@/modules/jobs/job-catalog";
import { scoreJobsForBlueprint } from "@/modules/jobs/job-fit-engine";
import type { JobSearchFilters } from "@/modules/jobs/job-schema";

const defaultFilters: JobSearchFilters = {
  workplace: "remote",
  salaryMin: 45000,
  benefits: [],
  fitGoals: ["raise_income_fast", "stabilize_schedule"],
};

async function getRecommendedJobs() {
  try {
    const prisma = getPrismaClient();
    const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
      where: { workspaceId: "demo_workspace" },
      orderBy: { createdAt: "desc" },
    });

    const blueprintJson =
      latestBlueprint &&
      typeof latestBlueprint.blueprintJson === "object" &&
      latestBlueprint.blueprintJson !== null
        ? latestBlueprint.blueprintJson
        : {};

    const blueprintSignals = extractJobSignalsFromBlueprint(
      blueprintJson as {
        priorityStack?: string[];
        riskWarnings?: string[];
        learnModuleKeys?: string[];
      },
    );

    return scoreJobsForBlueprint({
      blueprint: {
        priorityStack: blueprintSignals.priorityStack,
        riskWarnings: blueprintSignals.riskWarnings,
      },
      jobs: listJobs(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "DATABASE_URL is not configured for Prisma runtime access."
    ) {
      return scoreJobsForBlueprint({
        blueprint: {
          priorityStack: ["cover_essentials", "stabilize_cash_flow"],
          riskWarnings: ["income_volatility_risk"],
        },
        jobs: listJobs(),
      });
    }

    throw error;
  }
}

export default async function JobsPage() {
  const recommendedJobs = await getRecommendedJobs();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Jobs</p>
        <h1 className="mt-3 text-4xl font-bold">
          Income options that match real-life pressure.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-emerald-50/85">
          Explore roles that help stabilize the schedule, raise income faster,
          or open the next career lane without pretending your life is frictionless.
        </p>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
          <JobsFilterPanel filters={defaultFilters} />

          <section>
            <h2 className="text-2xl font-semibold text-white">Recommended jobs</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job.slug}
                  job={{
                    slug: job.slug,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    salaryLabel: job.salaryLabel,
                    fitSummary: job.fitSummary,
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
