type JobFitBadgeProps = {
  label: string;
};

export function JobFitBadge({ label }: JobFitBadgeProps) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200">
      {label.replaceAll("_", " ")}
    </span>
  );
}
