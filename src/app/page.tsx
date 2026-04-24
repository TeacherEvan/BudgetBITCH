"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
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
import { useEffect, useState, useSyncExternalStore } from "react";
import { MoneyLoadingWindow } from "@/components/launch/money-loading-window";
import LaunchWizard, { LAUNCH_PROFILE_STORAGE_KEY, type LaunchWizardProfile } from "@/components/launch/launch-wizard";
import { useLaunchTransition } from "@/components/launch/use-launch-transition";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { WelcomeWindow } from "@/components/welcome/welcome-window";
import { isClerkClientConfigured } from "@/lib/auth/clerk-config";

export const HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY = "budgetbitch:e2e-auth-state";

type HomeDisplayState = "loading" | "welcome" | "wizard" | "landing";

type HomeAuthState = {
  isLoaded: boolean;
  isSignedIn: boolean;
};

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

function hasCompletedLaunchProfile(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value) as Partial<LaunchWizardProfile>;
    return parsed.completed === true;
  } catch {
    return false;
  }
}

function getFallbackHomeAuthStateValue() {
  if (typeof window === "undefined") {
    return "loading" as const;
  }

  if (process.env.NODE_ENV === "production") {
    return "signed-out" as const;
  }

  const override = window.localStorage.getItem(HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY);

  return override === "signed-in" ? "signed-in" : "signed-out";
}

function HomeContent({ isLoaded, isSignedIn }: HomeAuthState) {
  const [homeState, setHomeState] = useState<HomeDisplayState>("loading");
  const { beginTransition, loadingWindow } = useLaunchTransition({
    onReady: () => setHomeState("landing"),
  });
  const displayState: HomeDisplayState = isLoaded ? homeState : "loading";

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (!isSignedIn) {
        setHomeState("welcome");
        return;
      }

      const savedProfile = window.localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
      setHomeState(hasCompletedLaunchProfile(savedProfile) ? "landing" : "wizard");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoaded, isSignedIn]);

  function handleLaunchComplete() {
    void beginTransition();
  }

  return (
    <>
      <MoneyLoadingWindow
        visible={loadingWindow.visible}
        reasons={loadingWindow.reasons}
        reducedMotion={loadingWindow.reducedMotion}
        showArt={loadingWindow.showArt}
      />

      <AnimatePresence>
        {displayState === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <WelcomeWindow
              signInHref="/sign-in?redirectTo=%2F"
              signUpHref="/sign-up?redirectTo=%2F"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {displayState === "wizard" && (
          <motion.div
            key="wizard"
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          >
            <LaunchWizard onComplete={handleLaunchComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {displayState === "landing" && (
          <motion.main
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="bb-page-shell"
          >
            <MobilePanelFrame>
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
            </MobilePanelFrame>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}

function HomeWithClerkAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  return <HomeContent isLoaded={isLoaded} isSignedIn={Boolean(isSignedIn)} />;
}

function subscribeToFallbackHomeAuthState() {
  return () => {};
}

function HomeWithoutClerkAuth() {
  const fallbackAuthState = useSyncExternalStore(
    subscribeToFallbackHomeAuthState,
    getFallbackHomeAuthStateValue,
    () => "loading",
  );

  const authState: HomeAuthState =
    fallbackAuthState === "signed-in"
      ? { isLoaded: true, isSignedIn: true }
      : fallbackAuthState === "signed-out"
        ? { isLoaded: true, isSignedIn: false }
        : { isLoaded: false, isSignedIn: false };

  return <HomeContent isLoaded={authState.isLoaded} isSignedIn={authState.isSignedIn} />;
}

export default function Home() {
  if (!isClerkClientConfigured()) {
    return <HomeWithoutClerkAuth />;
  }

  return <HomeWithClerkAuth />;
}
