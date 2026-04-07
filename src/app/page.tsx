"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import WelcomeScreen from "../../WelcomeWindow-startup/WelcomeScreen";

const WELCOME_DISMISSED_STORAGE_KEY = "budgetbitch:welcome-dismissed";

type WelcomeDisplayState = "pending" | "show" | "hidden";

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
            <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.9fr)]">
              <article className="bb-panel bb-panel-strong p-8 md:p-10 lg:p-12">
                <p className="bb-kicker">BudgetBITCH</p>
                <h1 className="mt-4 max-w-4xl text-5xl font-semibold md:text-6xl">
                  Financial control with a little theatrical menace.
                </h1>
                <p className="bb-copy mt-6 max-w-2xl text-lg">
                  Build a cash-flow survival plan first, then branch into lessons, jobs,
                  and guarded integrations without losing the thread of what matters now.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
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

                <div className="mt-10 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-3">
                  <div className="bb-metric">
                    <span className="bb-metric-value">Start Smart</span>
                    <p className="mt-2 text-sm text-(--text-muted)">
                      Region-aware guidance before you connect anything or chase busywork.
                    </p>
                  </div>
                  <div className="bb-metric">
                    <span className="bb-metric-value">Learn fast</span>
                    <p className="mt-2 text-sm text-(--text-muted)">
                      Lessons tied directly to your next move instead of generic advice soup.
                    </p>
                  </div>
                  <div className="bb-metric">
                    <span className="bb-metric-value">Guardrails</span>
                    <p className="mt-2 text-sm text-(--text-muted)">
                      Privacy-first connection flows and job routes that respect your reality.
                    </p>
                  </div>
                </div>
              </article>

              <aside className="grid gap-4">
                <article className="bb-panel bb-panel-accent p-6">
                  <p className="bb-kicker">Primary route</p>
                  <h2 className="mt-3 text-3xl font-semibold">Start Smart</h2>
                  <p className="mt-3 text-sm text-(--text-2)">
                    Build a Money Survival Blueprint anchored in your location, risk, and
                    the next seven days.
                  </p>
                  <Link href="/start-smart" className="bb-button-primary mt-6">
                    Start Smart
                  </Link>
                </article>

                <article className="bb-panel bb-panel-muted p-6">
                  <p className="bb-kicker">Then branch out</p>
                  <div className="mt-4 grid gap-2">
                    <Link href="/jobs" className="bb-link-card">
                      <span className="font-semibold text-white">Jobs that fit the plan</span>
                      <span className="text-sm text-(--text-muted)">
                        Explore work paths designed to stabilize income and schedule pressure.
                      </span>
                    </Link>
                    <Link href="/settings/integrations" className="bb-link-card">
                      <span className="font-semibold text-white">Trusted connection hub</span>
                      <span className="text-sm text-(--text-muted)">
                        Review official links, revoke paths, and privacy notes before connecting.
                      </span>
                    </Link>
                  </div>
                </article>
              </aside>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
