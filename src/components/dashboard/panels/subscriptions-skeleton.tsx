'use client';

import { motion } from 'framer-motion';

export function SubscriptionsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading subscriptions">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <motion.div className="h-6 w-40 bg-white/10 rounded-xl animate-pulse" />
        <motion.div className="h-10 w-32 bg-white/10 rounded-xl animate-pulse" />
      </motion.div>
      <div className="space-y-2" role="list">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10 animate-pulse"
          >
            <motion.div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <motion.div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
              <motion.div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
            </div>
            <motion.div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}