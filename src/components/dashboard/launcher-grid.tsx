import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

export type LauncherTool = {
  title: string;
  href: string;
  detail: string;
  label: string;
};

type LauncherGridProps = {
  tools: LauncherTool[];
};

export function LauncherGrid({ tools }: LauncherGridProps) {
  const t = useTranslations("launcherGrid");

  return (
    <section
      className="bb-panel bb-panel-strong p-5 md:min-h-0 md:overflow-y-auto"
      aria-labelledby="popular-budgeting-tools-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="bb-kicker">{t("kicker")}</p>
          <h2 id="popular-budgeting-tools-heading" className="mt-2 text-2xl font-semibold">
            {t("title")}
          </h2>
          <p className="bb-helper-copy mt-2 max-w-2xl text-sm">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="bb-compact-card p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="bb-status-pill">{tool.label}</span>
              <span className="bb-icon-badge" aria-hidden="true">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{tool.title}</h3>
              <p className="bb-mini-copy bb-summary-clip mt-1 text-sm" title={tool.detail}>
                {tool.detail}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
