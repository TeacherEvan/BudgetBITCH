'use client';

import { motion } from 'framer-motion';

export function NetWorthSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading net worth">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <motion.div className="h-6 w-32 bg-white/10 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          <motion.div className="h-9 w-24 bg-white/10 rounded-xl animate-pulse" />
          <motion.div className="h-9 w-24 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <motion.div className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse" />
        <motion.div className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse" />
        <motion.div className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse" />
      </motion.div>

      {/* Assets Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <motion.div className="flex items-center justify-between">
          <motion.div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
          <motion.div className="h-9 w-20 bg-white/10 rounded-xl animate-pulse" />
        </motion.div>
        <div className="space-y-2" role="list">
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`asset-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + 0.05 * i }}
              className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10 animate-pulse"
            >
              <motion.div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <motion.div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                <motion.div className="h-3.5 w-24 bg-white/5 rounded animate-pulse" />
              </div>
              <motion.div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Liabilities Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 pt-4 border-t border-white/10"
      >
        <motion.div className="flex items-center justify-between">
          <motion.div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
          <motion.div className="h-9 w-20 bg-white/10 rounded-xl animate-pulse" />
        </motion.div>
        <div className="space-y-2" role="list">
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`liability-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + 0.05 * i }}
              className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10 animate-pulse"
            >
              <motion.div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <motion.div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                <motion.div className="h-3.5 w-24 bg-white/5 rounded animate-pulse" />
              </div>
              <motion.div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}