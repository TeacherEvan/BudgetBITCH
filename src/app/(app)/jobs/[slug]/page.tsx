import { JobFitBadge } from "@/components/jobs/job-fit-badge";
import { getJobBySlug } from "@/modules/jobs/job-catalog";
import { notFound } from "next/navigation";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-[36px] border border-white/10 bg-black/20 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Jobs</p>
        <h1 className="mt-3 text-4xl font-bold">{job.title}</h1>
        <p className="mt-3 text-base text-emerald-50/85">
          {job.company} · {job.location}
        </p>

        <article className="mt-8 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Why this fits</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.fitSignals.map((signal) => (
              <JobFitBadge key={signal} label={signal} />
            ))}
          </div>
          <p className="mt-4 text-sm text-emerald-50/85">{job.summary}</p>
        </article>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Salary range</h2>
            <p className="mt-3 text-sm text-emerald-50/85">{job.salaryLabel}</p>
          </article>

          <article className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Schedule and setup</h2>
            <p className="mt-3 text-sm text-emerald-50/85">
              {job.schedule.replaceAll("_", " ")} · {job.workplace.replaceAll("_", " ")}
            </p>
          </article>
        </div>

        <article className="mt-8 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Benefits</h2>
          <ul className="mt-3 grid gap-2 text-sm text-emerald-50/85">
            {job.benefits.map((benefit) => (
              <li key={benefit}>{benefit.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
