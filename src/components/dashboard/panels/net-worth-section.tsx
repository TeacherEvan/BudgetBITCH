// components/dashboard/panels/net-worth-section.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './empty-state';

interface SectionProps<T> {
  title: string;
  addLabel: string;
  items: T[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  onAdd: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function NetWorthSection<T extends { id: string }>({
  title,
  addLabel,
  items,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onAdd,
  renderItem,
}: SectionProps<T>) {
  const hasItems = items.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <motion.h4
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-semibold text-white"
        >
          {title}
        </motion.h4>
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAdd}
        >
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {addLabel}
          </Button>
        </motion.button>
      </div>

      {hasItems ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
          role="list"
        >
          {items.map((item, index) => renderItem(item, index))}
        </motion.div>
      ) : (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8" aria-hidden="true" />}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onAdd}
        />
      )}
    </motion.div>
  );
}