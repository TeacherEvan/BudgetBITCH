'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { FeedCard } from './feed-card';
import { BudgetTipSkeleton } from './budget-tip-skeleton';
import loadingAnimation from '@/animations/loading-gold-shimmer.json';
import emptyLocationAnimation from '@/animations/empty-tuk-tuk.json';
import emptyNoItemsAnimation from '@/animations/empty-coin-jar.json';
import errorAnimation from '@/animations/error-signal-lost.json';
import refreshAnimation from '@/animations/refresh-coin-drop.json';

const BUDGET_TIPS_TH = [
  '💡 เติมน้ำมันวันพุธ-พฤหัส ราคามักถูกกว่า',
  '💡 ซื้อ 1 แถม 1 = ลด 50% ต่อชิ้น คุ้มกว่าลดราคา 30%',
  '💡 บัตรประจำเดือน BTS/MRT ประหยัดกว่าตั๋วเดี่ยว 30%+',
  '💡 เช็คราคาน้ำมัน PTT/Shell/Bangchak ก่อนเติมทุกครั้ง',
  '💡 ใช้ PromptPay จ่ายบิลบางแห่งมีส่วนลด 1-2%',
];

const BUDGET_TIPS_EN = [
  '💡 Fill up Wed-Thu — fuel prices often dip mid-week',
  '💡 Buy 1 Get 1 = 50% off per unit, beats 30% off',
  '💡 Monthly BTS/MRT pass saves 30%+ vs single tickets',
  '💡 Check PTT/Shell/Bangchak prices before every fill',
  '💡 Some bills give 1-2% off via PromptPay',
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

export function AnimatedFeedList({ locale }: { locale: 'th' | 'en' }) {
  const { items, loading, error, lastUpdated, refresh } = useVicinityFeeds(locale);
  const tips = locale === 'th' ? BUDGET_TIPS_TH : BUDGET_TIPS_EN;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
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
        <Lottie animationData={loadingAnimation} loop style={{ height: 120 }} />
        <BudgetTipSkeleton tips={tips} count={3} />
      </motion.div>
    );
  }

  // Empty: no location permission
  if (!error && items.length === 0 && !loading && !lastUpdated) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={emptyLocationAnimation} loop style={{ height: 160 }} />
        <p className="text-white/60 text-sm">
          {locale === 'th' ? 'อนุญาตตำแหน่งเพื่อดูข่าวใกล้ตัวคุณ' : 'Enable location for nearby news'}
        </p>
        <button
          onClick={() => navigator.geolocation.getCurrentPosition(() => {})}
          className="bb-button-primary mt-2"
        >
          {locale === 'th' ? 'เปิดตำแหน่ง' : 'Enable Location'}
        </button>
      </div>
    );
  }

  // Empty: no items after fetch
  if (!error && items.length === 0 && !loading) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={emptyNoItemsAnimation} loop style={{ height: 140 }} />
        <p className="text-white/50 text-sm">
          {locale === 'th' ? 'ยังไม่มีข่าวในพื้นที่นี้' : 'No local updates yet'}
        </p>
        <button onClick={refresh} className="bb-button-secondary text-sm">
          {locale === 'th' ? 'ลองใหม่' : 'Try again'}
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lottie animationData={errorAnimation} loop={false} style={{ height: 120 }} />
        <p className="text-rose-400 text-sm">{error}</p>
        <p className="text-white/40 text-xs">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
        </p>
        <button onClick={refresh} className="bb-button-primary">
          {locale === 'th' ? 'ลองอีกครั้ง' : 'Retry'}
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
            <Lottie animationData={refreshAnimation} loop style={{ height: 60, width: 60 }} />
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
          {locale === 'th' ? 'อัปเดต' : 'Updated'} {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </motion.div>
  );
}