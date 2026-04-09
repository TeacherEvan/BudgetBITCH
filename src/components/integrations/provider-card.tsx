import type { ProviderAction } from "@/modules/integrations/integration-actions";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import type { ProviderDefinition } from "@/modules/integrations/provider-types";
import { KeyRound } from "lucide-react";
import { PrivacyBadge } from "./privacy-badge";
import { ToolRail } from "./tool-rail";

type ProviderCardProps = {
  provider: ProviderDefinition;
  actions?: ProviderAction[];
};

const categorySummary: Record<ProviderDefinition["category"], string> = {
  ai: "Prompt-heavy tools and assistant access.",
  banking: "Bank connections and verification rails.",
  investing: "Portfolio, account, and brokerage access.",
  payroll: "Income and worker operations.",
  tax: "Tax filings, books, and accounting workflows.",
  finance_ops: "Operational money tooling and expense controls.",
};

const riskStyles: Record<
  ProviderDefinition["riskLevel"],
  { label: string; className: string }
> = {
  low: {
    label: "Low risk",
    className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  },
  medium: {
    label: "Medium risk",
    className: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  },
  high: {
    label: "High risk",
    className: "border-rose-300/30 bg-rose-400/10 text-rose-100",
  },
};

export function ProviderCard({ provider, actions }: ProviderCardProps) {
  const riskStyle = riskStyles[provider.riskLevel];
  const actionList = actions ?? buildProviderActionList(provider);

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">
            {provider.category.replaceAll("_", " ")}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{provider.label}</h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${riskStyle.className}`}
        >
          {riskStyle.label}
        </span>
      </div>

      <p className="mt-3 text-sm text-emerald-50/80">{categorySummary[provider.category]}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-100/80">
        <PrivacyBadge />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
          <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
          {provider.setupPath ? "Setup wizard" : "Guidance only"}
        </span>
      </div>

      <div className="mt-5">
        <ToolRail title="Quick actions" titleAs="p" actions={actionList} />
      </div>
    </article>
  );
}
