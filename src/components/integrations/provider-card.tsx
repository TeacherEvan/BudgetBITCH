import type { ProviderAction } from "@/modules/integrations/integration-actions";
import { buildProviderActionList } from "@/modules/integrations/integration-actions";
import type { ProviderDefinition } from "@/modules/integrations/provider-types";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { PrivacyBadge } from "./privacy-badge";
import { ToolRail } from "./tool-rail";

type ProviderCardProps = {
  provider: ProviderDefinition;
  actions?: ProviderAction[];
};

const riskStyles: Record<ProviderDefinition["riskLevel"], { className: string }> = {
  low: {
    className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  },
  medium: {
    className: "border-yellow-300/30 bg-yellow-400/10 text-yellow-100",
  },
  high: {
    className: "border-rose-300/30 bg-rose-400/10 text-rose-100",
  },
};

export function ProviderCard({ provider, actions }: ProviderCardProps) {
  const t = useTranslations("providerCard");
  const tActions = useTranslations("integrationActions");
  const riskStyle = riskStyles[provider.riskLevel];
  const actionList =
    actions ??
    buildProviderActionList(provider, {
      openSetupWizard: tActions("openSetupWizard"),
      openOfficialLogin: tActions("openOfficialLogin"),
      openOfficialDocs: tActions("openOfficialDocs"),
    });

  return (
    <article className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">
          {t(`categoryLabel.${provider.category}`)}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">{provider.label}</h3>
      </div>

      <p className="mt-3 max-w-[32ch] text-sm text-emerald-50/80">
        {t(`categorySummary.${provider.category}`)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-100/80">
        <span
          className={`inline-flex rounded-full border px-3 py-1 font-semibold ${riskStyle.className}`}
        >
          {t(`risk.${provider.riskLevel}`)}
        </span>
        <PrivacyBadge />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
          <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
          {provider.setupPath ? t("setupState.setupWizard") : t("setupState.guidanceOnly")}
        </span>
      </div>

      <div className="mt-5">
        <ToolRail title={t("quickActions") as string} titleAs="p" actions={actionList} />
      </div>
    </article>
  );
}
