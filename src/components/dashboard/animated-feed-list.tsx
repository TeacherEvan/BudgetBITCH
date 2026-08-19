'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lottie } from 'lottie-react';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { useResolvedLocation } from '@/hooks/use-resolved-location';
import { FeedCard } from './feed-card';
import { BudgetTipSkeleton } from './budget-tip-skeleton';
import loadingAnimation from '@/animations/loading-gold-shimmer.json';
import emptyLocationAnimation from '@/animations/empty-tuk-tuk.json';
import emptyNoItemsAnimation from '@/animations/empty-coin-jar.json';
import errorAnimation from '@/animations/error-signal-lost.json';
import refreshAnimation from '@/animations/refresh-coin-drop.json';

// lottie-web's default web-worker path runs completeData off-thread where
// animationData can arrive as undefined and throw "Cannot read properties of
// undefined (reading '0')". Force main-thread parsing. (TS types omit this
// flag, hence the cast.)
const NO_WORKER_SETTINGS = { useWebWorker: false } as unknown as Record<string, unknown>;

const BUDGET_TIPS_EN = [
  '💡 Fill up mid-week — fuel prices often dip Wed-Thu',
  '💡 Buy 1 Get 1 = 50% off per unit, beats 30% off',
  '💡 A monthly transit pass saves 30%+ vs single tickets',
  '💡 Compare fuel-station prices before every fill',
  '💡 Some billers give a discount for instant bank payments',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } },
};

export function AnimatedFeedList({ locale }: { locale: string }) {
  const { items, loading, error, lastUpdated, refresh } = useVicinityFeeds(locale);
  const { requestLocation } = useResolvedLocation();
  const tips = BUDGET_TIPS_EN;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setRefreshProgress] = useState(0);
  const startYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && !isRefreshing) {
      const progress = Math.min(delta / 100, 1);
      setRefreshProgress(progress);
      if (delta > 80) setIsRefreshing(true);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) {
      await refresh();
      setIsRefreshing(false);
      setRefreshProgress(0);
    } else {
      setRefreshProgress(0);
    }
  }, [isRefreshing, refresh]);

  // Loading state with skeletons
  if (loading && !lastUpdated) {
    return (
      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
        <Lottie src={loadingAnimation} loop style={{ height: 120 }} rendererSettings={NO_WORKER_SETTINGS} />
        <BudgetTipSkeleton tips={tips} count={3} />
      </motion.div>
    );
  }

  // Empty: no location permission
  if (!error && items.length === 0 && !loading && !lastUpdated) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie src={emptyLocationAnimation} loop style={{ height: 160 }} rendererSettings={NO_WORKER_SETTINGS} />
        <p className="text-white/60 text-sm">
          {'Enable location for nearby news'}
        </p>
        <button
          onClick={async () => { await requestLocation(); }}
          className="bb-button-primary mt-2 cursor-pointer"
        >
          {'Enable Location'}
        </button>
      </div>
    );
  }

  // Empty: no items after fetch
  if (!error && items.length === 0 && !loading) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie src={emptyNoItemsAnimation} loop style={{ height: 140 }} rendererSettings={NO_WORKER_SETTINGS} />
        <p className="text-white/50 text-sm">
          {'No local updates yet'}
        </p>
        <button onClick={refresh} className="bb-button-secondary text-sm">
          {'Try again'}
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie src={errorAnimation} loop={false} style={{ height: 120 }} rendererSettings={NO_WORKER_SETTINGS} />
        <p className="text-rose-400 text-sm">{error}</p>
        <p className="text-white/40 text-xs">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
        </p>
        <button onClick={refresh} className="bb-button-primary">
          {'Retry'}
        </button>
      </div>
    );
  }

  // Success: animated list
  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div key="refresh" layout className="flex justify-center py-2" animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Lottie src={refreshAnimation} loop style={{ height: 60, width: 60 }} rendererSettings={NO_WORKER_SETTINGS} />
          </motion.div>
        )}
      </AnimatePresence>

      {items.map((item, index) => (
        <motion.article key={item.link} variants={itemVariants} layout>
          <FeedCard item={item} locale={locale} index={index} />
        </motion.article>
      ))}

      {lastUpdated && (
        <p className="text-center text-white/30 text-xs mt-4">
          {'Updated'} {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </motion.div>
  );
}