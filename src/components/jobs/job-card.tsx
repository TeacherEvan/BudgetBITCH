import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, DollarSign, MapPin } from "lucide-react";
import { JobFitBadge } from "./job-fit-badge";

type JobCardProps = {
  job: {
    slug: string;
    title: string;
    company: string;
    location: string;
    salaryLabel: string;
    hasSpecificFitCue: boolean;
    fitSummary: string;
    summary: string;
    workplace: string;
    schedule: string;
    jobType: string;
    postingAgeDays: number;
    fitSignals: string[];
  };
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatPostingAge(postingAgeDays: number) {
  if (postingAgeDays === 0) {
    return "Posted today";
  }

  return postingAgeDays === 1
    ? "Posted 1 day ago"
    : `Posted ${postingAgeDays} days ago`;
}

function clampCue(copy: string) {
  const [firstSentence] = copy.split(".");
  const compactCopy = firstSentence.trim();

  if (compactCopy.length <= 72) {
    return compactCopy;
  }

  return `${compactCopy.slice(0, 69).trimEnd()}...`;
}

function getFitCue(hasSpecificFitCue: boolean, fitSummary: string, summary: string) {
  if (!hasSpecificFitCue) {
    return clampCue(summary);
  }

  return fitSummary;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">{job.company}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{job.title}</h3>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-emerald-50/80 sm:grid-cols-2">
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
        <p className="flex items-center gap-2">
          <BriefcaseBusiness aria-hidden="true" className="h-4 w-4 text-emerald-200" />
          {formatLabel(job.workplace)} · {formatLabel(job.jobType)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/75">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          {formatPostingAge(job.postingAgeDays)}
        </span>
      </div>

      <div className="mt-4 rounded-[20px] border border-emerald-200/20 bg-emerald-300/10 p-3">
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">Best for</p>
        <p className="mt-2 text-sm text-emerald-50">
          {getFitCue(job.hasSpecificFitCue, job.fitSummary, job.summary)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-2">
        {job.fitSignals.slice(0, 3).map((signal) => (
          <JobFitBadge key={signal} label={signal} />
        ))}
      </div>

      <Link
        href={`/jobs/${job.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        Open job details
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
