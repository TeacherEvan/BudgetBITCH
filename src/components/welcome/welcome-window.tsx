// src/components/welcome/welcome-window.tsx
'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Waypoints, Coins } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { MobilePanelFrame } from '@/components/mobile/mobile-panel-frame';
import { ProTipsCard } from '@/components/pro-tips/pro-tips-card';
import { motion } from 'framer-motion';

type WelcomeWindowProps = {
  signInHref: string;
  signUpHref: string;
};

const sloganMap = {
  en: 'Shut up and do it!!!',
  th: 'หุบปากแล้วทำซะ!!!',
  zh: '别废话，开干！！！'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const letterVariants = {
  hidden: { 
    opacity: 0, 
    y: -100, 
    scale: 2.5,
    rotateX: -90,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring' as const,
      damping: 8,
      stiffness: 140
    }
  }
};

function generateBackgroundParticles() {
  return Array.from({ length: 10 }).map((_, idx) => {
    // Generate pseudo-random coordinates and times based on index to ensure purity
    const xOffset = (idx * 17) % 100;
    const scaleFactor = 0.4 + ((idx * 7) % 5) * 0.1;
    const animDuration = 10 + ((idx * 9) % 4) * 3;
    const animDelay = ((idx * 3) % 6) * 1.2;
    const characters = ['🪙', '💵', '$'];
    return {
      id: idx,
      x: `${xOffset}%`,
      scale: scaleFactor,
      duration: animDuration,
      delay: animDelay,
      char: characters[idx % characters.length]
    };
  });
}

const backgroundParticles = generateBackgroundParticles();

export function WelcomeWindow({ signInHref, signUpHref }: WelcomeWindowProps) {
  const t = useTranslations('welcome');
  
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

  return (
    <main className="bb-page-shell relative px-4 py-8 text-white md:px-5 md:py-10 overflow-hidden min-h-screen flex items-center justify-center">
      {/* Cinematic Ambient Gold Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Floating Money Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {backgroundParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.x, 
              y: '110vh', 
              opacity: 0, 
              scale: p.scale,
              rotate: 0 
            }}
            animate={{ 
              y: '-10vh', 
              opacity: [0, 0.35, 0.35, 0],
              rotate: 360 
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            className="absolute text-amber-400/20 font-black text-2xl select-none"
          >
            {p.char}
          </motion.div>
        ))}
      </div>

      <MobilePanelFrame>
        <section className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] z-10">
          {/* Main Welcome panel */}
          <article className="bb-panel bg-black/85 backdrop-blur-md border border-amber-400/20 shadow-[0_0_50px_rgba(245,215,66,0.05)] p-7 md:p-9 relative overflow-hidden">
            {/* Top gold line accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400 shadow-[0_0_15px_rgba(245,215,66,0.1)]">
                <Coins className="h-3.5 w-3.5" />
                <span>BOSS MODE</span>
              </span>
              <LocaleSwitcher />
            </div>

            {/* Cinematic 3D Letter Slam Headline */}
            <div className="mt-6 flex flex-col items-start gap-1 select-none" style={{ perspective: '1000px' }}>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap text-5xl md:text-7xl font-black uppercase tracking-tight font-space-grotesk text-white"
              >
                {Array.from('BUDGET').map((char, index) => (
                  <motion.span 
                    key={index} 
                    variants={letterVariants} 
                    className="inline-block transform-gpu filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                    style={{ transformOrigin: 'bottom center' }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap text-6xl md:text-8xl font-black uppercase tracking-widest font-space-grotesk bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent"
              >
                {Array.from('BOSS').map((char, index) => (
                  <motion.span 
                    key={index} 
                    variants={letterVariants} 
                    className="inline-block transform-gpu filter drop-shadow-[0_6px_25px_rgba(245,215,66,0.55)]"
                    style={{ transformOrigin: 'bottom center' }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* Shouted Slogan Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 220, damping: 10 }}
              className="inline-block mt-5 rounded-2xl border-2 border-amber-400 bg-zinc-950 px-5 py-2.5 shadow-[0_0_30px_rgba(245,215,66,0.25)] animate-pulse select-none"
            >
              <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent filter drop-shadow">
                &ldquo;{slogan}&rdquo;
              </span>
            </motion.div>

            <p className="bb-copy mt-6 max-w-2xl text-sm md:text-base text-zinc-300">
              {t('description')}
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link href={signInHref} className="bb-button-primary border border-amber-400/40 bg-amber-400 text-black hover:bg-amber-300 hover:shadow-[0_0_20px_rgba(245,215,66,0.3)] transition-all">
                {t('openSignIn')}
              </Link>
              <Link href={signUpHref} className="bb-button-secondary border border-zinc-800 text-white hover:bg-white/5 transition-all">
                {t('openSignUp')}
              </Link>
            </div>

            <p className="bb-mini-copy mt-4 text-xs text-zinc-500">
              {t('privacyPromise')}
            </p>

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