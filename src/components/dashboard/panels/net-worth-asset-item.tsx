// components/dashboard/panels/net-worth-asset-item.tsx
'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { ASSET_TYPES } from './net-worth-types';

interface Asset {
  id: string;
  name: string;
  value: number;
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'gold' | 'crypto' | 'other';
}

interface AssetItemProps {
  asset: Asset;
  locale: 'th' | 'en';
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  index: number;
}

export function AssetItem({ asset, locale, onEdit, onDelete, index }: AssetItemProps) {
  const typeInfo = ASSET_TYPES.find(t => t.value === asset.type);

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
          className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-400 text-xl"
        >
          {typeInfo?.icon}
        </motion.div>
        <div>
          <p className="font-medium text-white">{asset.name}</p>
          <p className="text-xs text-white/60 capitalize">{typeInfo?.label[locale === 'th' ? 'th' : 'en']}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-emerald-400">{formatCurrency(asset.value, locale)}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(asset)}
        >
          <Button variant="ghost" size="sm" aria-label={locale === 'th' ? 'แก้ไข' : 'Edit'}>
            <Edit className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(asset.id)}
        >
          <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-500/10" aria-label={locale === 'th' ? 'ลบ' : 'Delete'}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </motion.button>
      </div>
    </motion.div>
  );
}