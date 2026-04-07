import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  Compass,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type SignalCard = {
  title: string;
  state: string;
  detail: string;
  icon: LucideIcon;
  tone: "moss" | "gold" | "clay";
};

type ActionCard = {
  title: string;
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  tone: "primary" | "secondary" | "ghost";
  surfaceTone: "moss" | "gold" | "clay";
};

type ExpansionLane = {
  title: string;
  href: string;
  label: string;
  state: string;
  detail: string;
  icon: LucideIcon;
  tone: "moss" | "gold" | "clay";
};

const signalCards: SignalCard[] = [
  {
    title: "Luck Meter",
    state: "Watching",
    detail: "A quick read on this month’s pressure and breathing room.",
    icon: Sparkles,
    tone: "gold",
  },
  {
    title: "Bills Due Soon",
    state: "Queue ready",
    detail: "Sort the next due dates by bite order, not by guilt.",
    icon: Clock3,
    tone: "clay",
  },
  {
    title: "Money Survival Blueprint",
    state: "Priority",
    detail: "Still the first move when the board needs a steady anchor.",
    icon: Compass,
    tone: "moss",
  },
];

const actionCards: ActionCard[] = [
  {
    title: "Start Smart",
    href: "/start-smart",
    label: "Build blueprint",
    detail: "Map the next seven days and find the safest first move.",
    icon: Compass,
    tone: "primary",
    surfaceTone: "gold",
  },
  {
    title: "Learn",
    href: "/learn",
    label: "Open Learn",
    detail: "Pull in short lessons once the blueprint tells you where to aim.",
    icon: BookOpen,
    tone: "secondary",
    surfaceTone: "moss",
  },
  {
    title: "Jobs",
    href: "/jobs",
    label: "Open Jobs",
    detail: "Browse income routes that match the plan instead of blowing it up.",
    icon: BriefcaseBusiness,
    tone: "ghost",
    surfaceTone: "clay",
  },
];

const expansionLanes: ExpansionLane[] = [
  {
    title: "Learn",
    href: "/learn",
    label: "Open Learn",
    state: "Not started",
    detail: "Lesson loops are standing by for when the blueprint is locked in.",
    icon: BookOpen,
    tone: "gold",
  },
  {
    title: "Jobs",
    href: "/jobs",
    label: "Open Jobs",
    state: "Explore",
    detail: "Income routes are ready when you need backup without schedule chaos.",
    icon: BriefcaseBusiness,
    tone: "moss",
  },
  {
    title: "Connected Finance",
    href: "/settings/integrations",
    label: "Open Hub",
    state: "Guarded",
    detail: "Privacy notes and revoke paths stay visible before anything connects.",
    icon: ShieldCheck,
    tone: "clay",
  },
];

function IconBadge({ icon: Icon, tone }: { icon: LucideIcon; tone?: "moss" | "gold" | "clay" }) {
  return (
    <span className="bb-icon-badge" data-tone={tone} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function buttonClassName(tone: ActionCard["tone"]) {
  if (tone === "primary") {
    return "bb-button-primary";
  }

  if (tone === "secondary") {
    return "bb-button-secondary";
  }

  return "bb-button-ghost";
}

export default function DashboardPage() {
  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.84fr)]">
        <div className="grid gap-6">
          <article className="bb-app-warm-hero p-8 md:p-10">
            <p className="bb-kicker">Dashboard</p>
            <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)] xl:items-end">
              <div>
                <h1 className="text-5xl font-semibold">Treasure Map</h1>
                <p className="bb-copy bb-app-warm-copy-soft mt-4 max-w-2xl text-base md:text-lg">
                  A tighter control board for what needs attention first, what can wait, and
                  where the next safe move lives.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/start-smart" className="bb-button-primary">
                    Start Smart
                  </Link>
                  <Link href="/learn" className="bb-button-secondary">
                    Open Learn
                  </Link>
                </div>
              </div>

              <div className="grid gap-3" aria-label="Priority signals">
                {signalCards.map(({ title, state, detail, icon, tone }) => (
                  <article key={title} className="bb-app-warm-card bb-compact-card" data-tone={tone}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={icon} tone={tone} />
                        <div>
                          <h2 className="text-xl font-semibold">{title}</h2>
                          <p className="bb-mini-copy bb-app-warm-copy-soft mt-1">{detail}</p>
                        </div>
                      </div>
                      <span className="bb-status-pill" data-tone={tone}>{state}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <section className="bb-app-warm-panel p-6" data-tone="gold" aria-labelledby="dashboard-actions-heading">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="bb-kicker">Quick actions</p>
                  <h2 id="dashboard-actions-heading" className="mt-3 text-3xl font-semibold">
                    Run the board
                  </h2>
                </div>
                <Sparkles className="h-5 w-5 text-(--accent-strong)" aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {actionCards.map(({ title, href, label, detail, icon, tone, surfaceTone }) => (
                  <article key={title} className="bb-app-warm-card bb-cluster" data-tone={surfaceTone}>
                    <div className="flex items-start gap-3">
                      <IconBadge icon={icon} tone={surfaceTone} />
                      <div>
                        <h3 className="text-2xl font-semibold">{title}</h3>
                        <p className="bb-mini-copy bb-app-warm-copy-soft mt-1">{detail}</p>
                      </div>
                    </div>
                    <Link href={href} className={buttonClassName(tone)}>
                      {label}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="bb-app-warm-panel p-6" data-tone="moss" aria-labelledby="dashboard-overview-heading">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="bb-kicker">Overview cluster</p>
                  <h2 id="dashboard-overview-heading" className="mt-3 text-3xl font-semibold">
                    Control signals
                  </h2>
                </div>
                <Clock3 className="h-5 w-5 text-(--accent-strong)" aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-3">
                {signalCards.map(({ title, state, detail, icon, tone }) => (
                  <article
                    key={`${title}-overview`}
                    className="bb-app-warm-card bb-compact-card"
                    data-tone={tone}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={icon} tone={tone} />
                        <div>
                          <span className="font-semibold text-white">{title}</span>
                          <span className="bb-mini-copy bb-app-warm-copy-soft mt-1 block">{detail}</span>
                        </div>
                      </div>
                      <span className="bb-status-pill" data-tone={tone}>{state}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="grid gap-4 self-start">
          <article className="bb-app-warm-panel p-6" data-tone="gold">
            <p className="bb-kicker">Priority build</p>
            <h2 className="mt-3 text-4xl font-semibold">Money Survival Blueprint</h2>
            <p className="bb-mini-copy bb-app-warm-copy-soft mt-3 text-(--text-2)">
              Keep the blueprint as the control board anchor when the month starts feeling loud.
            </p>
            <Link href="/start-smart" className="bb-button-primary mt-6">
              Start Smart
            </Link>
          </article>

          <section className="bb-app-warm-panel p-6" data-tone="clay" aria-labelledby="dashboard-lanes-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="bb-kicker">Expansion lanes</p>
                <h2 id="dashboard-lanes-heading" className="mt-3 text-3xl font-semibold">
                  Side quests, clearly marked
                </h2>
              </div>
              <ArrowRight className="h-5 w-5 text-(--accent-strong)" aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-3">
              {expansionLanes.map(({ title, href, label, state, detail, icon, tone }) => (
                <article key={title} className="bb-app-warm-card bb-cluster" data-tone={tone}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <IconBadge icon={icon} tone={tone} />
                      <div>
                        <h3 className="text-2xl font-semibold">{title}</h3>
                        <p className="bb-mini-copy bb-app-warm-copy-soft mt-1">{detail}</p>
                      </div>
                    </div>
                    <span className="bb-status-pill" data-tone={tone}>{state}</span>
                  </div>
                  <Link href={href} className="bb-lane-link" data-tone={tone}>
                    <span className="font-semibold text-white">{label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-(--accent-strong)" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
