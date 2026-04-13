import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type StoryPanel = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "moss" | "gold" | "clay";
};

type RouteBucket = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "moss" | "gold" | "clay";
  links: Array<{
    href: string;
    label: string;
    hint: string;
  }>;
};

const storyPanels: StoryPanel[] = [
  {
    title: "Plot the rescue",
    description: "Build a seven-day money plan before the chaos gets theatrical.",
    icon: Compass,
    tone: "gold",
  },
  {
    title: "Practice in loops",
    description: "Learn in small bursts tied to the next decision on your board.",
    icon: BookOpen,
    tone: "moss",
  },
  {
    title: "Open routes safely",
    description: "Jobs and integrations stay inside privacy-first guardrails.",
    icon: ShieldCheck,
    tone: "clay",
  },
];

const routeBuckets: RouteBucket[] = [
  {
    title: "Build lane",
    description: "Get the plan on paper, then keep the control board close.",
    icon: Sparkles,
    tone: "gold",
    links: [
      {
        href: "/start-smart",
        label: "Start Smart",
        hint: "Blueprint first",
      },
      {
        href: "/dashboard",
        label: "Open dashboard",
        hint: "See the control board",
      },
    ],
  },
  {
    title: "Momentum lane",
    description: "Use lessons and job routes when the plan needs backup.",
    icon: BriefcaseBusiness,
    tone: "moss",
    links: [
      {
        href: "/learn",
        label: "Learn with context",
        hint: "Short, timely lessons",
      },
      {
        href: "/jobs",
        label: "Explore jobs",
        hint: "Income paths that fit the blueprint",
      },
    ],
  },
  {
    title: "Guardrail lane",
    description: "Connect outside systems only when the trust story is clear.",
    icon: LayoutDashboard,
    tone: "clay",
    links: [
      {
        href: "/settings/integrations",
        label: "Guard connection hub",
        hint: "Review privacy and revoke paths",
      },
    ],
  },
];

function IconBadge({ icon: Icon, tone }: { icon: LucideIcon; tone?: "moss" | "gold" | "clay" }) {
  return (
    <span className="bb-icon-badge" data-tone={tone} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export default function Home() {
  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
        <article className="bb-app-warm-hero p-8 md:p-10 lg:p-11">
          <p className="bb-kicker">BudgetBITCH</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold md:text-6xl">
            Plan first. Panic less.
          </h1>
          <p className="bb-copy bb-app-warm-copy-soft mt-5 max-w-2xl text-base md:text-lg">
            Sketch the rescue route, learn the next move, and only open outside systems when the
            guardrails feel solid.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/start-smart" className="bb-button-primary">
              Build my blueprint
            </Link>
            <Link href="/dashboard" className="bb-button-secondary">
              Open dashboard
            </Link>
            <Link href="/learn" className="bb-button-ghost">
              Learn with context
            </Link>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="BudgetBITCH story panels">
            {storyPanels.map(({ title, description, icon, tone }) => (
              <article key={title} className="bb-app-warm-card bb-compact-card" data-tone={tone}>
                <div className="flex items-start justify-between gap-3">
                  <IconBadge icon={icon} tone={tone} />
                  <Sparkles className="h-4 w-4 text-(--accent-strong)" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{title}</h2>
                  <p className="bb-mini-copy bb-app-warm-copy-soft mt-2">{description}</p>
                </div>
              </article>
            ))}
          </section>
        </article>

        <aside className="grid gap-4 self-start">
          <article className="bb-app-warm-panel p-6" data-tone="gold">
            <p className="bb-kicker">Entry board</p>
            <h2 id="route-lanes-heading" className="mt-3 text-3xl font-semibold">Route lanes</h2>
            <p className="bb-mini-copy bb-app-warm-copy-soft mt-3">
              Pick a bucket, skip the sprawl: one lane for planning, one for momentum, and one for
              guarded connections.
            </p>
          </article>

          <section className="grid gap-3" aria-labelledby="route-lanes-heading">
            {routeBuckets.map(({ title, description, icon, tone, links }) => {
              const bucketId = title.toLowerCase().replace(/\s+/g, "-");

              return (
                <section
                  key={title}
                  className="bb-app-warm-card bb-cluster"
                  data-tone={tone}
                  aria-labelledby={bucketId}
                >
                  <div className="flex items-start gap-3">
                    <IconBadge icon={icon} tone={tone} />
                    <div>
                      <h3 id={bucketId} className="text-2xl font-semibold">
                        {title}
                      </h3>
                      <p className="bb-mini-copy bb-app-warm-copy-soft mt-1">{description}</p>
                    </div>
                  </div>

                  <div className="bb-stack-list">
                    {links.map(({ href, label, hint }) => (
                      <Link key={href} href={href} className="bb-lane-link" data-tone={tone}>
                        <div>
                          <span className="font-semibold text-white">{label}</span>
                          <span className="bb-mini-copy bb-app-warm-copy-soft mt-1 block">{hint}</span>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-(--accent-strong)"
                          aria-hidden="true"
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </section>
        </aside>
      </section>
    </main>
  );
}
