// src/components/welcome/welcome-window.tsx
'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Waypoints, Coins } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { MobilePanelFrame } from '@/components/mobile/mobile-panel-frame';
import { ProTipsCard } from '@/components/pro-tips/pro-tips-card';

type WelcomeWindowProps = {
  signInHref: string;
  signUpHref: string;
};

const sloganMap = {
  en: 'Shut up and do it!!!',
  th: 'หุบปากแล้วทำซะ!!!',
  zh: '别废话，开干！！！'
};

// Shared expo-out curve for a calm, premium reveal.
const EXPO_OUT = [0.22, 1, 0.36, 1] as const;

export function WelcomeWindow({ signInHref, signUpHref }: WelcomeWindowProps) {
  const t = useTranslations('welcome');
  const prefersReduced = useReducedMotion();

  // Safe locale extraction from next-intl (defaulting to 'en')
  let currentLocale: 'en' | 'th' | 'zh' = 'en';
  try {
    const rawLocale = t('brand'); // trigger locale lookup or check translation keys
    if (rawLocale.includes('บอร์ด')) {
      currentLocale = 'th';
    } else if (rawLocale.includes('控制板')) {
      currentLocale = 'zh';
    }
  } catch {
    currentLocale = 'en';
  }

  const slogan = sloganMap[currentLocale] || sloganMap.en;

  const quickReasons = [
    {
      title: t('quickReasons.signInFirst.title'),
      description: t('quickReasons.signInFirst.description'),
      icon: ShieldCheck,
    },
    {
      title: t('quickReasons.keepItShort.title'),
      description: t('quickReasons.keepItShort.description'),
      icon: Sparkles,
    },
    {
      title: t('quickReasons.moveWithoutSprawl.title'),
      description: t('quickReasons.moveWithoutSprawl.description'),
      icon: Waypoints,
    },
  ] as const;

  // Choreography: backdrop -> eyebrow -> wordmark -> sweep -> subhead/cta.
  const eyebrow: Variants = {
    hidden: prefersReduced ? { opacity: 1 } : { opacity: 0, letterSpacing: '0.5em' },
    visible: {
      opacity: 1,
      letterSpacing: '0.2em',
      transition: { duration: 0.8, ease: 'easeOut', delay: prefersReduced ? 0 : 0.1 },
    },
  };

  const wordmark: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.07,
        delayChildren: prefersReduced ? 0 : 0.4,
      },
    },
  };

  const letter: Variants = {
    hidden: prefersReduced
      ? { opacity: 1, y: '0%', filter: 'blur(0px)' }
      : { opacity: 0, y: '110%', filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: '0%',
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: EXPO_OUT },
    },
  };

  const fadeUp: Variants = {
    hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <main className="bb-page-shell relative px-4 py-8 text-white md:px-5 md:py-10 overflow-hidden min-h-screen flex items-center justify-center">
      {/* Centered dark radial backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,215,66,0.06),transparent_60%)] pointer-events-none z-0" />

      {/* Single breathing gold glow behind the wordmark (premium, not noisy) */}
      <motion.div
        data-testid="welcome-breathing-glow"
        initial={{ opacity: prefersReduced ? 0.45 : 0.3 }}
        animate={
          prefersReduced
            ? { opacity: 0.45 }
            : { opacity: [0.3, 0.55, 0.3] }
        }
        transition={
          prefersReduced
            ? { duration: 0 }
            : { duration: 6, ease: 'easeInOut', repeat: Infinity }
        }
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0"
      />

      <MobilePanelFrame>
        <section className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] z-10">
          {/* Main Welcome panel */}
          <article className="bb-panel bg-black/85 backdrop-blur-md border border-amber-400/20 shadow-[0_0_50px_rgba(245,215,66,0.05)] p-7 md:p-9 relative overflow-hidden">
            {/* Top gold line accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="flex items-start justify-between gap-4">
              <motion.span
                variants={eyebrow}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-semibold uppercase text-amber-400"
              >
                <Coins className="h-3.5 w-3.5" />
                <span>BOSS MODE</span>
              </motion.span>
              <LocaleSwitcher />
            </div>

            {/* Cinematic masked wordmark reveal */}
            <div
              className="mt-6 flex flex-col items-start gap-1 select-none relative"
              style={{ perspective: '1000px' }}
            >
              {/* One-shot light sweep across the gold wordmark */}
              {!prefersReduced && (
                <motion.div
                  data-testid="welcome-light-sweep"
                  initial={{ x: '-150%', opacity: 0 }}
                  animate={{ x: '250%', opacity: [0, 0.9, 0] }}
                  transition={{ delay: 1.5, duration: 1.1, ease: 'easeInOut' }}
                  className="absolute inset-0 z-20 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
                    transform: 'skewX(-18deg)',
                    mixBlendMode: 'screen',
                  }}
                />
              )}

              <motion.div
                variants={wordmark}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap text-5xl md:text-7xl font-black uppercase tracking-tight font-space-grotesk text-white"
                aria-label="BUDGET"
              >
                {Array.from('BUDGET').map((char, index) => (
                  <span key={index} className="inline-block overflow-hidden">
                    <motion.span
                      variants={letter}
                      className="inline-block transform-gpu"
                    >
                      {char}
                    </motion.span>
                  </span>
                ))}
              </motion.div>

              <motion.div
                variants={wordmark}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap text-6xl md:text-8xl font-black uppercase tracking-widest font-space-grotesk bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent"
                aria-label="BOSS"
              >
                {Array.from('BOSS').map((char, index) => (
                  <span key={index} className="inline-block overflow-hidden">
                    <motion.span variants={letter} className="inline-block transform-gpu">
                      {char}
                    </motion.span>
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Quiet refined slogan line (no pulse, no rotate, no blast shadow) */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mt-5">
              <span className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                &ldquo;{slogan}&rdquo;
              </span>
            </motion.div>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bb-copy mt-6 max-w-2xl text-sm md:text-base text-zinc-300"
            >
              {t('description')}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-6 flex flex-wrap gap-4"
            >
              <Link href={signInHref} className="bb-button-primary border border-amber-400/40 bg-amber-400 text-black hover:bg-amber-300 hover:shadow-[0_0_20px_rgba(245,215,66,0.3)] transition-all">
                {t('openSignIn')}
              </Link>
              <Link href={signUpHref} className="bb-button-secondary border border-zinc-800 text-white hover:bg-white/5 transition-all">
                {t('openSignUp')}
              </Link>
            </motion.div>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bb-mini-copy mt-4 text-xs text-zinc-500"
            >
              {t('privacyPromise')}
            </motion.p>

            {/* Random Pro-Tips Widget Integration */}
            <div className="mt-8">
              <ProTipsCard locale={currentLocale === 'th' ? 'th' : 'en'} />
            </div>

            {/* Features list */}
            <ul
              className="mt-6 grid gap-3"
              aria-label={t('quickReasonsAria')}
            >
              {quickReasons.map(({ title, description, icon: Icon }) => (
                <li
                  key={title}
                  className="rounded-[1.15rem] border border-zinc-800 bg-white/5 px-4 py-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <ArrowRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="bb-mini-copy mt-1 text-xs text-zinc-400">{description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Right sidebar */}
          <aside className="grid gap-4 self-start">
            <article className="bb-panel border border-amber-400/10 bg-black/85 backdrop-blur-md p-5">
              <p className="bb-kicker text-amber-400">{t('rootFlow')}</p>
              <h2 className="mt-2 text-xl font-bold text-white">{t('authFirstThenSetup')}</h2>
              <p className="bb-mini-copy mt-2 text-xs text-zinc-400">
                {t('rootFlowDescription')}
              </p>
            </article>

            <article className="bb-panel border border-amber-400/10 bg-black/85 backdrop-blur-md p-5">
              <p className="bb-kicker text-amber-400">{t('whatChangesNext')}</p>
              <ul className="mt-3 grid gap-2.5 text-xs text-zinc-300">
                <li className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-2.5">
                  {t('nextSteps.signIn')}
                </li>
                <li className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-2.5">
                  {t('nextSteps.signUp')}
                </li>
                <li className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-2.5">
                  {t('nextSteps.finishWizard')}
                </li>
              </ul>
            </article>
          </aside>
        </section>
      </MobilePanelFrame>
    </main>
  );
}
