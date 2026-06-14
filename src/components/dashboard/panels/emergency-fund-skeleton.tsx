'use client';

import { motion } from 'framer-motion';

export function EmergencyFundSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading emergency fund">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-6 w-48 bg-white/10 rounded-xl animate-pulse"
      />
      <div className="flex items-center gap-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-white/5 rounded-full animate-pulse"
        />
        <div className="flex-1 space-y-2">
          <motion.div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <motion.div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
          <motion.div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          <motion.div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-white/10 bg-black/20 p-4 animate-pulse"
      >
        <motion.div className="h-5 w-40 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-3">
          <motion.div className="h-10 bg-white/10 rounded-xl animate-pulse" />
          <motion.div className="h-10 bg-white/10 rounded-xl animate-pulse" />
          <motion.div className="h-10 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}