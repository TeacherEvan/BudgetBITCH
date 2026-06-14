// components/dashboard/panels/net-worth-liability-item.tsx
'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { LIABILITY_TYPES } from './net-worth-types';

interface Liability {
  id: string;
  name: string;
  value: number;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other';
}

interface LiabilityItemProps {
  liability: Liability;
  locale: 'th' | 'en';
  onEdit: (liability: Liability) => void;
  onDelete: (id: string) => void;
  index: number;
}

export function LiabilityItem({ liability, locale, onEdit, onDelete, index }: LiabilityItemProps) {
  const typeInfo = LIABILITY_TYPES.find(t => t.value === liability.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10 transition-colors hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-10 h-10 rounded-xl bg-rose-400/20 flex items-center justify-center text-rose-400"
        >
          💳
        </motion.div>
        <div>
          <p className="font-medium text-white">{liability.name}</p>
          <p className="text-xs text-white/60 capitalize">{typeInfo?.label[locale === 'th' ? 'th' : 'en']}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-rose-400">{formatCurrency(liability.value, locale)}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(liability)}
        >
          <Button variant="ghost" size="sm" aria-label={locale === 'th' ? 'แก้ไข' : 'Edit'}>
            <Edit className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(liability.id)}
        >
          <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-500/10" aria-label={locale === 'th' ? 'ลบ' : 'Delete'}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.button>
      </div>
    </motion.div>
  );
}