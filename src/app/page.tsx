"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { useEffect, useState } from "react";
import WelcomeScreen from "../../WelcomeWindow-startup/WelcomeScreen";

const WELCOME_DISMISSED_STORAGE_KEY = "budgetbitch:welcome-dismissed";

type WelcomeDisplayState = "pending" | "show" | "hidden";

type StoryPanel = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type RouteBucket = {
  title: string;
  description: string;
  icon: LucideIcon;
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
  },
  {
    title: "Practice in loops",
    description: "Learn in small bursts tied to the next decision on your board.",
    icon: BookOpen,
  },
  {
    title: "Open routes safely",
    description: "Jobs and integrations stay inside privacy-first guardrails.",
    icon: ShieldCheck,
  },
];

const routeBuckets: RouteBucket[] = [
  {
    title: "Build lane",
    description: "Get the plan on paper, then keep the control board close.",
    icon: Sparkles,
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
    links: [
      {
        href: "/settings/integrations",
        label: "Guard connection hub",
        hint: "Review privacy and revoke paths",
      },
    ],
  },
];

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="bb-icon-badge" aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export default function Home() {
  const [welcomeState, setWelcomeState] = useState<WelcomeDisplayState>("pending");

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nextWelcomeState: WelcomeDisplayState;

    try {
      const dismissedWelcome =
        window.localStorage.getItem(WELCOME_DISMISSED_STORAGE_KEY) === "true";

      nextWelcomeState = motionPreference.matches || dismissedWelcome ? "hidden" : "show";
    } catch {
      nextWelcomeState = motionPreference.matches ? "hidden" : "show";
    }

    const frame = window.requestAnimationFrame(() => {
      setWelcomeState(nextWelcomeState);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleEnterWelcome() {
    try {
      window.localStorage.setItem(WELCOME_DISMISSED_STORAGE_KEY, "true");
    } catch {
      // Ignore storage access failures and continue into the app.
    }

    setWelcomeState("hidden");
  }

  return (
    <>
      <AnimatePresence>
        {welcomeState === "show" && (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          >
            <WelcomeScreen onEnter={handleEnterWelcome} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {welcomeState === "hidden" && (
          <motion.main
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="bb-page-shell"
          >
            <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
              <article className="bb-panel bb-panel-strong p-8 md:p-10 lg:p-11">
                <p className="bb-kicker">BudgetBITCH</p>
                <h1 className="mt-4 max-w-3xl text-5xl font-semibold md:text-6xl">
                  Plan first. Panic less.
                </h1>
                <p className="bb-copy mt-5 max-w-2xl text-base md:text-lg">
                  Sketch the rescue route, learn the next move, and only open outside systems
                  when the guardrails feel solid.
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

                <div
                  className="mt-8 grid gap-4 md:grid-cols-3"
                  aria-label="BudgetBITCH story panels"
                >
                  {storyPanels.map(({ title, description, icon }) => (
                    <article key={title} className="bb-compact-card">
                      <div className="flex items-start justify-between gap-3">
                        <IconBadge icon={icon} />
                        <Sparkles className="h-4 w-4 text-(--accent-strong)" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">{title}</h2>
                        <p className="bb-mini-copy mt-2">{description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <aside className="grid gap-4 self-start">
                <article className="bb-panel bb-panel-accent p-6">
                  <p className="bb-kicker">Entry board</p>
                  <h2 className="mt-3 text-3xl font-semibold">Route lanes</h2>
                  <p className="bb-mini-copy mt-3">
                    Pick a bucket, skip the sprawl: one lane for planning, one for momentum, and
                    one for guarded connections.
                  </p>
                </article>

                <div className="grid gap-3" aria-label="Main route buckets">
                  {routeBuckets.map(({ title, description, icon, links }) => {
                    const bucketId = title.toLowerCase().replace(/\s+/g, "-");

                    return (
                      <section key={title} className="bb-cluster" aria-labelledby={bucketId}>
                        <div className="flex items-start gap-3">
                          <IconBadge icon={icon} />
                          <div>
                            <h3 id={bucketId} className="text-2xl font-semibold">
                              {title}
                            </h3>
                            <p className="bb-mini-copy mt-1">{description}</p>
                          </div>
                        </div>

                        <div className="bb-stack-list">
                          {links.map(({ href, label, hint }) => (
                            <Link key={href} href={href} className="bb-lane-link">
                              <div>
                                <span className="font-semibold text-white">{label}</span>
                                <span className="bb-mini-copy mt-1 block">{hint}</span>
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
                </div>
              </aside>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
