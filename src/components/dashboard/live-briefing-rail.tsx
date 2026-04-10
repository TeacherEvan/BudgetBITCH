import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";

type LiveBriefingRailProps = {
  briefing: DashboardBriefingSnapshot;
};

export function LiveBriefingRail({ briefing }: LiveBriefingRailProps) {
  return (
    <section className="bb-panel bb-panel-muted p-5" aria-labelledby="live-briefing-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="bb-kicker">Briefing</p>
          <h2 id="live-briefing-heading" className="mt-2 text-2xl font-semibold">
            Live briefing
          </h2>
          <p className="bb-mini-copy mt-2 max-w-2xl text-sm">
            Five trusted topics, three short fields each, trimmed for fast scanning.
          </p>
        </div>
        <span className="bb-status-pill">{briefing.sourceStatus}</span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {briefing.topics.map((topic) => (
          <article key={topic.key} className="bb-cluster p-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="bb-kicker">{topic.key}</p>
                <h3 className="mt-1 text-sm font-semibold">{topic.label}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-white/80">{topic.fields.length} fields</span>
            </div>

            <ul className="grid gap-1">
              {topic.fields.map((field) => (
                <li key={field.id} className="rounded-2xl border border-white/10 bg-black/20 p-1.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white" title={field.summary}>
                        {field.label} · {field.summary}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-white/80">{field.sourceName}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
