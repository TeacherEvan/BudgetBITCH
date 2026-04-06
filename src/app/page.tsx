"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import WelcomeScreen from "../../WelcomeWindow-startup/WelcomeScreen";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          >
            <WelcomeScreen onEnter={() => setShowWelcome(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showWelcome && (
          <motion.main
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen items-center justify-center p-8"
          >
            <section className="rounded-4xl border border-emerald-200/20 bg-black/20 p-10 text-center backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">BudgetBITCH</p>
              <h1 className="mt-4 text-4xl font-bold">The storybook spectacle starts here.</h1>
              <p className="mt-4 max-w-2xl text-base text-emerald-50/85">
                Secure budgeting, reminders, integrations, and cinematic financial clarity.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  href="/start-smart"
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Start Smart
                </Link>
                <Link
                  href="/learn"
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Learn!
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full border border-sky-200/30 bg-sky-300/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-300/30"
                >
                  Jobs
                </Link>
              </div>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
