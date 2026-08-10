'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BudgetTipSkeletonProps {
  tips: string[];
  count: number;
}

export function BudgetTipSkeleton({ tips, count }: BudgetTipSkeletonProps) {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (tips.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="h-16 bg-white/5 rounded-xl relative overflow-hidden"
          role="status"
          aria-label={`Budget tip skeleton ${i + 1}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold-glow)]/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      ))}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentTip}
          className="text-center text-white/40 text-xs mt-2 font-mono"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {tips[currentTip]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}