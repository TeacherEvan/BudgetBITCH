import Link from "next/link";

type JobCardProps = {
  job: {
    slug: string;
    title: string;
    company: string;
    location: string;
    salaryLabel: string;
    fitSummary: string;
  };
};

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-4xl border border-white/10 bg-black/20 p-5 text-white">
      <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">
        {job.company}
      </p>
      <h3 className="mt-3 text-2xl font-semibold">{job.title}</h3>
      <p className="mt-2 text-sm text-emerald-50/80">{job.location}</p>
      <p className="mt-2 text-sm text-emerald-50/80">{job.salaryLabel}</p>
      <p className="mt-4 text-sm text-emerald-100/75">{job.fitSummary}</p>
      <Link
        href={`/jobs/${job.slug}`}
        className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Open job
      </Link>
    </article>
  );
}
