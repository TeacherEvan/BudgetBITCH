import { RadioTower } from "lucide-react";
import { useTranslations } from "next-intl";

type BroadcastBarProps = {
  cityLabel: string;
  tickerItems: string[];
};

export function BroadcastBar({ cityLabel, tickerItems }: BroadcastBarProps) {
  const t = useTranslations("broadcastBar");
  const tickerText = tickerItems.length > 0 ? tickerItems.join("  ·  ") : t("fallbackTicker");

  return (
    <section className="bb-panel bb-panel-accent overflow-hidden p-4" aria-labelledby="local-area-heading">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex items-center gap-3">
          <span className="bb-icon-badge" aria-hidden="true">
            <RadioTower className="h-5 w-5" />
          </span>
          <div>
            <p className="bb-kicker">{t("kicker")}</p>
            <h2 id="local-area-heading" className="mt-1 text-2xl font-semibold">
              {t("title")}
            </h2>
            <p className="bb-mini-copy mt-1 text-sm text-white/90">{cityLabel}</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-full border border-white/10 bg-black/20 px-3 py-2">
          <div className="flex min-w-max items-center gap-3 whitespace-nowrap text-xs font-medium text-white/90">
            <span>{tickerText}</span>
            <span aria-hidden="true">{tickerText}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
