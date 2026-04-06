"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
            <section className="rounded-[32px] border border-emerald-200/20 bg-black/20 p-10 text-center backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">BudgetBITCH</p>
              <h1 className="mt-4 text-4xl font-bold">The storybook spectacle starts here.</h1>
              <p className="mt-4 max-w-2xl text-base text-emerald-50/85">
                Secure budgeting, reminders, integrations, and cinematic financial clarity.
              </p>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
