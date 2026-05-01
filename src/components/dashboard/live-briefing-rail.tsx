import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
import { useTranslations } from "next-intl";

type LiveBriefingRailProps = {
  briefing: DashboardBriefingSnapshot;
};

export function LiveBriefingRail({ briefing }: LiveBriefingRailProps) {
  const t = useTranslations("liveBriefing");

  return (
    <section
      className="bb-panel bb-panel-muted p-5 md:min-h-0 md:overflow-y-auto"
      aria-labelledby="live-briefing-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="bb-kicker">{t("kicker")}</p>
          <h2 id="live-briefing-heading" className="mt-2 text-2xl font-semibold">
            {t("title")}
          </h2>
          <p className="bb-helper-copy mt-2 max-w-2xl text-sm">
            {t("description")}
          </p>
        </div>
        <span className="bb-status-pill">{t(`sourceStatus.${briefing.sourceStatus}`)}</span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {briefing.topics.length === 0 ? (
          <p className="bb-mini-copy">{t("emptyState")}</p>
        ) : (
          briefing.topics.map((topic) => (
            <article key={topic.key} className="bb-cluster p-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{topic.label}</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-white/80">
                  {t("fieldCount", { count: topic.fields.length })}
                </span>
              </div>

              <ul className="grid gap-1">
                {topic.fields.map((field) => (
                  <li key={field.id} className="rounded-2xl border border-white/10 bg-black/20 p-1.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">{field.label}</p>
                        <p className="bb-mini-copy bb-summary-clip mt-1 text-xs" title={field.summary}>
                          {field.summary}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.55rem] font-semibold text-white/80">
                        {field.sourceName}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
