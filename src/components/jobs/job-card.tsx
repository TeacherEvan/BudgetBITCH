import Link from "next/link";
import { ArrowRight, Clock3, DollarSign, MapPin } from "lucide-react";
import { JobFitBadge } from "./job-fit-badge";

type JobCardProps = {
  job: {
    slug: string;
    title: string;
    company: string;
    location: string;
    salaryLabel: string;
    fitSummary: string;
    summary: string;
    workplace: string;
    schedule: string;
    fitSignals: string[];
  };
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">{job.company}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{job.title}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
          {formatLabel(job.workplace)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-emerald-50/80 sm:grid-cols-3">
        <p className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="h-4 w-4 text-emerald-200" />
          {job.location}
        </p>
        <p className="flex items-center gap-2">
          <DollarSign aria-hidden="true" className="h-4 w-4 text-emerald-200" />
          {job.salaryLabel}
        </p>
        <p className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-emerald-200" />
          {formatLabel(job.schedule)}
        </p>
      </div>

      <p className="mt-4 text-sm text-emerald-50/85">{job.summary}</p>
      <p className="mt-2 text-sm text-emerald-100/70">{job.fitSummary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.fitSignals.slice(0, 3).map((signal) => (
          <JobFitBadge key={signal} label={signal} />
        ))}
      </div>

      <Link
        href={`/jobs/${job.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Open job
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
