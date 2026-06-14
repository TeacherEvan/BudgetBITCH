'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
      role="status"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/60 max-w-xs mx-auto">{description}</p>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2"
      >
        <Button size="sm" onClick={onAction}>
          <Plus className="w-4 h-4 mr-1" />
          {actionLabel}
        </Button>
      </motion.button>
    </motion.div>
  );
}