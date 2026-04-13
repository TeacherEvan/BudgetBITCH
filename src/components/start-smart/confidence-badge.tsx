type ConfidenceBadgeProps = {
  confidence: "verified" | "estimated" | "user_entered";
};

const confidenceStyles: Record<
  ConfidenceBadgeProps["confidence"],
  { label: string; className: string }
> = {
  verified: {
    label: "Verified",
    className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  },
  estimated: {
    label: "Estimated",
    className: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  },
  user_entered: {
    label: "User entered",
    className: "border-orange-300/30 bg-orange-400/10 text-orange-100",
  },
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const style = confidenceStyles[confidence];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${style.className}`}
    >
      {style.label}
    </span>
  );
}